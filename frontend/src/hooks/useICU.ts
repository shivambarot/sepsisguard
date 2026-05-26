import { useEffect, useRef, useState, useCallback } from "react";
import type { Alert, ICUStats, Patient, VitalsHistoryPoint, WSMessage } from "../types";

const WS_URL = "ws://localhost:8000/ws";
const RECONNECT_DELAY = 3000;

export function useICU() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<Record<string, VitalsHistoryPoint[]>>({});
  const [stats, setStats] = useState<ICUStats>({ total_patients: 0, critical: 0, high: 0, stable: 0 });
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsPerMin, setEventsPerMin] = useState(0);
  const eventTimesRef = useRef<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (e: MessageEvent) => {
      const msg: WSMessage = JSON.parse(e.data);
      setLastUpdate(new Date());

      // Track events-per-minute
      const now = Date.now();
      eventTimesRef.current = [...eventTimesRef.current.filter(t => now - t < 60000), now];
      setEventsPerMin(eventTimesRef.current.length);
      setTotalEvents(prev => prev + 1);

      if (msg.type === "snapshot") {
        if (msg.patients) setPatients(msg.patients);
        if (msg.alerts)   setAlerts(msg.alerts);
        if (msg.vitals_history) setHistory(msg.vitals_history);
        if (msg.stats)    setStats(msg.stats);
      } else if (msg.type === "vitals_update" && msg.vitals && msg.alert) {
        const v = msg.vitals;
        const a = msg.alert;
        setPatients(prev => {
          const idx = prev.findIndex(p => p.patient_id === v.patient_id);
          const updated = { ...v, ...a };
          if (idx === -1) return [...prev, updated];
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
        if (a.risk_level === "HIGH" || a.risk_level === "CRITICAL") {
          setAlerts(prev => [a, ...prev].slice(0, 50));
        }
        setHistory(prev => {
          const pid = v.patient_id;
          const point: VitalsHistoryPoint = {
            timestamp: v.timestamp,
            heart_rate: v.heart_rate,
            systolic_bp: v.systolic_bp,
            spo2: v.spo2,
            temperature: v.temperature,
            respiratory_rate: v.respiratory_rate,
            lactate: v.lactate,
            risk_score: a.risk_score,
          };
          const existing = prev[pid] ?? [];
          return { ...prev, [pid]: [...existing, point].slice(-30) };
        });
        setStats(prev => {
          // recount from patients — we update stats after patient list updates
          return prev; // stats updated on next snapshot
        });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectRef.current && clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Derive stats live from patients
  const liveStats: ICUStats = {
    total_patients: patients.length,
    critical: patients.filter(p => p.risk_level === "CRITICAL").length,
    high:     patients.filter(p => p.risk_level === "HIGH").length,
    stable:   patients.filter(p => p.risk_level === "LOW" || p.risk_level === "MEDIUM").length,
  };

  return { patients, alerts, history, stats: liveStats, connected, lastUpdate, totalEvents, eventsPerMin };
}
