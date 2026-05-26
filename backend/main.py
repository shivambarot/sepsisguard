"""
Sepsis Early Warning — FastAPI Backend

Mock mode: spawns the Python producer internally, processes vitals in-process,
           broadcasts via WebSocket.
Live mode: consumes from Confluent Kafka topics (icu-vitals + sepsis-alerts).
"""
import asyncio
import json
import os
import sys
import logging
from collections import defaultdict, deque
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Allow imports from sibling directories
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "producer"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "processor"))

from vitals_generator import PATIENT_PROFILES, generate_vitals
from sepsis_scorer import score_vitals

logging.basicConfig(level=logging.INFO, format="%(asctime)s [BACKEND]  %(message)s")
log = logging.getLogger(__name__)

MOCK_MODE    = os.getenv("MOCK_MODE", "true").lower() == "true"
BOOTSTRAP    = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS", "")
API_KEY      = os.getenv("CONFLUENT_API_KEY", "")
API_SECRET   = os.getenv("CONFLUENT_API_SECRET", "")
VITALS_TOPIC = os.getenv("VITALS_TOPIC", "icu-vitals")
ALERTS_TOPIC = os.getenv("ALERTS_TOPIC", "sepsis-alerts")
INTERVAL     = float(os.getenv("PRODUCER_INTERVAL_SECONDS", "4"))

app = FastAPI(title="Sepsis Early Warning API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ───────────────────────────────────────────────────────────
class ICUState:
    def __init__(self):
        self.patients: dict[str, dict] = {}
        self.vitals_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=30))
        self.alerts: deque = deque(maxlen=100)
        self.alert_counts: dict[str, int] = defaultdict(int)
        self.tick: int = 0

    def ingest_vitals(self, vitals: dict) -> dict:
        pid = vitals["patient_id"]
        alert = score_vitals(vitals)
        self.patients[pid] = {**vitals, **alert}
        self.vitals_history[pid].append({
            "timestamp":        vitals["timestamp"],
            "heart_rate":       vitals["heart_rate"],
            "systolic_bp":      vitals["systolic_bp"],
            "spo2":             vitals["spo2"],
            "temperature":      vitals["temperature"],
            "respiratory_rate": vitals["respiratory_rate"],
            "lactate":          vitals["lactate"],
            "risk_score":       alert["risk_score"],
        })
        if alert["risk_level"] in ("HIGH", "CRITICAL"):
            self.alerts.appendleft(alert)
            self.alert_counts[pid] += 1
        return alert

    def snapshot(self) -> dict:
        critical = sum(1 for p in self.patients.values() if p.get("risk_level") == "CRITICAL")
        high     = sum(1 for p in self.patients.values() if p.get("risk_level") == "HIGH")
        return {
            "type":          "snapshot",
            "timestamp":     datetime.utcnow().isoformat() + "Z",
            "patients":      list(self.patients.values()),
            "alerts":        list(self.alerts)[:20],
            "vitals_history": {pid: list(hist) for pid, hist in self.vitals_history.items()},
            "stats": {
                "total_patients": len(self.patients),
                "critical":       critical,
                "high":           high,
                "stable":         len(self.patients) - critical - high,
            },
        }


state = ICUState()
clients: set[WebSocket] = set()


async def broadcast(data: dict):
    dead = set()
    msg = json.dumps(data)
    for ws in clients:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


# ── Mock producer loop ────────────────────────────────────────────────────────
async def mock_producer_loop():
    log.info("Mock producer started — generating vitals every %.1fs", INTERVAL)
    while True:
        for patient in PATIENT_PROFILES:
            vitals = generate_vitals(patient, state.tick)
            alert  = state.ingest_vitals(vitals)
            event  = {
                "type":    "vitals_update",
                "vitals":  vitals,
                "alert":   alert,
            }
            await broadcast(event)
        state.tick += 1
        await asyncio.sleep(INTERVAL)


# ── Kafka consumer loop ───────────────────────────────────────────────────────
async def kafka_consumer_loop():
    from confluent_kafka import Consumer, KafkaError
    import threading

    main_loop = asyncio.get_event_loop()

    def _consume():
        consumer = Consumer({
            "bootstrap.servers":  BOOTSTRAP,
            "security.protocol":  "SASL_SSL",
            "sasl.mechanisms":    "PLAIN",
            "sasl.username":      API_KEY,
            "sasl.password":      API_SECRET,
            "group.id":           "sepsis-backend-group",
            "auto.offset.reset":  "latest",
        })
        consumer.subscribe([VITALS_TOPIC, ALERTS_TOPIC])
        log.info("Kafka consumer subscribed to %s + %s", VITALS_TOPIC, ALERTS_TOPIC)

        try:
            while True:
                msg = consumer.poll(0.5)
                if msg is None or msg.error():
                    continue
                data = json.loads(msg.value().decode())
                if msg.topic() == VITALS_TOPIC:
                    alert = state.ingest_vitals(data)
                    event = {"type": "vitals_update", "vitals": data, "alert": alert}
                else:
                    event = {"type": "alert", "alert": data}
                asyncio.run_coroutine_threadsafe(broadcast(event), main_loop)
        finally:
            consumer.close()

    thread = threading.Thread(target=_consume, daemon=True)
    thread.start()


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    if MOCK_MODE:
        asyncio.create_task(mock_producer_loop())
        log.info("Running in MOCK mode — no Confluent keys required")
    else:
        asyncio.create_task(kafka_consumer_loop())
        log.info("Running in LIVE mode — connected to Confluent Cloud")


# ── REST endpoints ────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "mode": "mock" if MOCK_MODE else "live"}


@app.get("/api/state")
def get_state():
    return state.snapshot()


@app.get("/api/patients")
def get_patients():
    return list(state.patients.values())


@app.get("/api/patients/{patient_id}/history")
def get_history(patient_id: str):
    return list(state.vitals_history.get(patient_id, []))


@app.get("/api/alerts")
def get_alerts():
    return list(state.alerts)


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    log.info("Client connected — total=%d", len(clients))

    # Send current state immediately on connect
    if state.patients:
        await websocket.send_text(json.dumps(state.snapshot()))

    try:
        while True:
            # Keep connection alive; real data comes from broadcast()
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)
        log.info("Client disconnected — total=%d", len(clients))
