import { X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Patient, VitalsHistoryPoint } from "../types";
import clsx from "clsx";

interface Props {
  patient: Patient;
  history: VitalsHistoryPoint[];
  onClose: () => void;
}

const CHARTS: { key: keyof VitalsHistoryPoint; label: string; color: string; unit: string; warnLine?: number; critLine?: number }[] = [
  { key: "heart_rate",       label: "Heart Rate",        color: "#f87171", unit: "bpm",    warnLine: 100 },
  { key: "systolic_bp",      label: "Systolic BP",       color: "#fb923c", unit: "mmHg",   warnLine: 100 },
  { key: "spo2",             label: "SpO₂",              color: "#34d399", unit: "%",      warnLine: 94, critLine: 90 },
  { key: "respiratory_rate", label: "Respiratory Rate",  color: "#60a5fa", unit: "/min",   warnLine: 22 },
  { key: "temperature",      label: "Temperature",       color: "#fbbf24", unit: "°C",     warnLine: 38.3 },
  { key: "lactate",          label: "Lactate",           color: "#c084fc", unit: "mmol/L", warnLine: 2, critLine: 4 },
];

function fmt(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function PatientDetail({ patient, history, onClose }: Props) {
  const mapped = history.map(h => ({ ...h, time: fmt(h.timestamp) }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-white font-bold text-lg">{patient.patient_name}</h2>
            <p className="text-slate-400 text-sm">{patient.age}y · {patient.ward} · ID: {patient.patient_id}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-bold",
              patient.risk_level === "CRITICAL" ? "bg-red-600 text-white" :
              patient.risk_level === "HIGH"     ? "bg-orange-600 text-white" :
              patient.risk_level === "MEDIUM"   ? "bg-yellow-600 text-white" :
                                                  "bg-emerald-700 text-white"
            )}>
              {patient.risk_level} · Score {patient.risk_score.toFixed(1)}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Flags */}
        {patient.flags?.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap gap-2">
            {patient.flags.map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-red-950 border border-red-800 text-red-300">
                ⚠ {f}
              </span>
            ))}
          </div>
        )}

        {/* Charts grid */}
        <div className="grid grid-cols-2 gap-4 p-6">
          {CHARTS.map(({ key, label, color, unit, warnLine, critLine }) => (
            <div key={key} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300 font-medium">{label}</span>
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {(patient[key as keyof Patient] as number)?.toFixed(1)} {unit}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={mapped} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#475569", fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 11, borderRadius: 6 }}
                    formatter={(v: number) => [`${v.toFixed(1)} ${unit}`, label]}
                  />
                  {warnLine && <ReferenceLine y={warnLine} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} />}
                  {critLine && <ReferenceLine y={critLine} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />}
                  <Line
                    type="monotone" dataKey={key} stroke={color}
                    dot={false} strokeWidth={2} isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* GCS + WBC row */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
          <Stat label="Glasgow Coma Scale (GCS)" value={patient.gcs} unit="/15"
            warn={patient.gcs < 15} critical={patient.gcs < 10} />
          <Stat label="White Blood Cells" value={patient.wbc?.toFixed(1)} unit="k/µL"
            warn={patient.wbc > 12 || patient.wbc < 4} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, warn, critical }: {
  label: string; value: string | number; unit: string; warn?: boolean; critical?: boolean;
}) {
  return (
    <div className={clsx(
      "rounded-xl p-4 border",
      critical ? "bg-red-950 border-red-700" :
      warn     ? "bg-orange-950 border-orange-800" :
                 "bg-slate-800 border-slate-700"
    )}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={clsx("font-mono font-bold text-2xl",
        critical ? "text-red-300" : warn ? "text-orange-300" : "text-slate-200")}>
        {value}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}
