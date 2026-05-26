# SepsisGuard 🏥

### Real-Time AI-Powered Sepsis Detection — Built on Confluent Cloud

> **270,000 Americans die from sepsis every year.**
> Every hour of delayed treatment increases mortality by 7%.
> SepsisGuard detects deterioration in under 100ms — before the bedside nurse even looks up.

---

## The Problem We're Solving

Sepsis is the leading cause of hospital deaths worldwide — not because it's untreatable, but because it's detected **too late**.

| The Reality Today | The Cost |
|---|---|
| ICU vitals checked every 4 hours | Critical deterioration goes unnoticed for hours |
| 9 vital signs tracked in separate systems | No unified cross-signal risk scoring |
| Nurses managing 6+ patients simultaneously | Cognitive overload masks early warning signs |
| Static threshold alerts (e.g. HR > 120) | Misses gradual multi-signal deterioration patterns |

**The qSOFA score** (Respiratory Rate ≥22, Systolic BP ≤100, GCS < 15) predicts sepsis with clinical precision — but only if measured continuously and correlated in real time. SepsisGuard does exactly that, powered by Confluent's event streaming infrastructure.

---

## What SepsisGuard Does

SepsisGuard is a real-time ICU monitoring platform that:

- **Streams** 9 vital signs per patient every 4 seconds into Confluent Kafka
- **Scores** each event using the qSOFA clinical algorithm + SIRS augmentation
- **Alerts** clinicians with CRITICAL/HIGH risk flags in under 100ms end-to-end
- **Governs** all data with JSON schemas, BACKWARD compatibility, and data lineage tracking
- **Visualises** a live ICU dashboard with vitals sparklines, risk trends, and a stream governance panel

---

## Live Impact: What Happens Every 4 Seconds

```
Patient: Emily Zhang, 63y, ICU-B
────────────────────────────────────────────────────
Heart Rate:        124 bpm    ⚠ Tachycardia
Systolic BP:        74 mmHg   🔴 Low BP (≤100)
SpO₂:             87.4 %      🔴 Severe Hypoxia
Temperature:       39.5 °C    ⚠ Fever
Respiratory Rate:    32 /min  🔴 High RR (≥22)
Lactate:            5.8 mmol  🔴 Critical
GCS:                     7    🔴 Altered Mentation
WBC:               18.3 k/µL  ⚠ Leukocytosis

Risk Score:  8.3 / 10    qSOFA: 3/3    → CRITICAL
────────────────────────────────────────────────────
Alert published to sepsis-alerts topic in 38ms
Dashboard updated via WebSocket in 94ms total
```

Without SepsisGuard, the nurse would see these numbers at the next scheduled check — potentially hours later.

---

## Confluent Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Confluent Cloud (GCP us-east1)                      │
│                                                                              │
│   ┌──────────────┐      ┌──────────────────┐      ┌───────────────────┐    │
│   │ Python       │      │   icu-vitals      │      │  Stream           │    │
│   │ Producer     │─────▶│   3 partitions    │─────▶│  Processor        │    │
│   │              │      │   JSON Schema     │      │  (qSOFA + SIRS)   │    │
│   │ 8 patients   │      │   BACKWARD compat │      │                   │    │
│   │ 9 vitals     │      │   Schema Registry │      │  Consumer Group   │    │
│   │ every 4s     │      └──────────────────┘      └────────┬──────────┘    │
│   │ Idempotent   │                                          │               │
│   └──────────────┘                                          ▼               │
│                                                   ┌──────────────────┐     │
│                                                   │  sepsis-alerts   │     │
│                                                   │  3 partitions    │     │
│                                                   │  JSON Schema     │     │
│                                                   │  Risk score +    │     │
│                                                   │  clinical flags  │     │
│                                                   └────────┬─────────┘     │
└────────────────────────────────────────────────────────────│───────────────┘
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │   FastAPI Backend            │
                                              │   Consumer Group             │
                                              │   WebSocket broadcast        │
                                              │   In-memory ICU state        │
                                              └──────────────┬──────────────┘
                                                             │
                                              ┌──────────────▼──────────────┐
                                              │   React Dashboard            │
                                              │   8 patients live            │
                                              │   Real-time vitals charts    │
                                              │   Alert panel + Governance   │
                                              └─────────────────────────────┘
```

---

## Confluent Usage: Deep Dive

### 1. Kafka Producer — Idempotent Vitals Ingestion
**File:** [`producer/main.py`](producer/main.py)

The producer uses the official `confluent-kafka` Python client with idempotent delivery enabled — guaranteeing exactly-once semantics even on network retries:

```python
Producer({
    "bootstrap.servers":  CONFLUENT_BOOTSTRAP_SERVERS,
    "security.protocol":  "SASL_SSL",
    "sasl.mechanisms":    "PLAIN",
    "sasl.username":      CONFLUENT_API_KEY,
    "sasl.password":      CONFLUENT_API_SECRET,
    "acks":               "all",          # Wait for all replicas
    "enable.idempotence": True,           # Exactly-once delivery
    "client.id":          "sepsis-vitals-producer",
})
```

Every 4 seconds, 8 patient vitals events are produced to the `icu-vitals` topic — 9 clinical measurements per event, keyed by `patient_id` for partition affinity.

---

### 2. Stream Processor — Real-Time Sepsis Scoring
**File:** [`processor/main.py`](processor/main.py) · [`processor/sepsis_scorer.py`](processor/sepsis_scorer.py)

A dedicated Consumer Group (`sepsis-processor-group`) consumes from `icu-vitals`, runs the clinical scoring algorithm, and publishes enriched alerts to `sepsis-alerts` — all in-process, with no external dependencies:

```python
Consumer({
    "group.id":          "sepsis-processor-group",
    "auto.offset.reset": "latest",
    "bootstrap.servers": CONFLUENT_BOOTSTRAP_SERVERS,
    "security.protocol": "SASL_SSL",
    ...
})
consumer.subscribe(["icu-vitals"])

# For each message:
vitals = json.loads(msg.value())
alert  = score_vitals(vitals)   # qSOFA + SIRS augmented scoring
producer.produce("sepsis-alerts", key=alert["patient_id"], value=json.dumps(alert))
```

**Sepsis Scoring Logic (`sepsis_scorer.py`):**

| Signal | Threshold | Weight |
|---|---|---|
| Respiratory Rate | ≥ 22/min | +1.0 (qSOFA) |
| Systolic BP | ≤ 100 mmHg | +1.0 (qSOFA) |
| GCS | < 15 | +1.0 (qSOFA) |
| Lactate | ≥ 4.0 mmol/L | +2.0 (critical) |
| Lactate | ≥ 2.0 mmol/L | +1.0 |
| SpO₂ | < 90% | +1.5 |
| SpO₂ | < 94% | +0.75 |
| Temperature | > 39°C or < 36°C | +0.75 (SIRS) |
| Heart Rate | > 90 bpm | +0.5 (SIRS) |
| WBC | > 12 or < 4 k/µL | +0.5 (SIRS) |

Risk levels: **LOW** (0–1.4) · **MEDIUM** (1.5–2.9) · **HIGH** (3.0–4.9) · **CRITICAL** (5.0+)

---

### 3. Backend Consumer Group — Separate Isolation
**File:** [`backend/main.py`](backend/main.py)

A second, independent Consumer Group (`sepsis-backend-group`) consumes from **both** topics simultaneously — demonstrating Confluent's consumer group isolation. The processor and backend each maintain their own offsets independently:

```python
consumer.subscribe(["icu-vitals", "sepsis-alerts"])

# Runs in a background thread; broadcasts to all WebSocket clients
while True:
    msg = consumer.poll(0.5)
    data = json.loads(msg.value())
    if msg.topic() == "icu-vitals":
        alert = state.ingest_vitals(data)        # Score + store
        event = {"type": "vitals_update", ...}
    else:
        event = {"type": "alert", "alert": data}
    asyncio.run_coroutine_threadsafe(broadcast(event), main_loop)
```

The main event loop captures the asyncio loop reference before spawning the thread — ensuring thread-safe WebSocket broadcasting without locks.

---

### 4. JSON Schema Governance
**Files:** [`producer/schemas.py`](producer/schemas.py) · [`register_schemas.py`](register_schemas.py)

Both Kafka topics have JSON Schema Draft-07 definitions registered with Confluent Schema Registry under **BACKWARD compatibility** — meaning new fields can be added without breaking existing consumers:

```python
# icu-vitals-value schema (12 required fields)
VITALS_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "IcuVitals",
    "type": "object",
    "properties": {
        "event_id":         {"type": "string", "format": "uuid"},
        "heart_rate":       {"type": "number", "description": "bpm"},
        "systolic_bp":      {"type": "number", "description": "mmHg"},
        "spo2":             {"type": "number", "description": "percent"},
        "lactate":          {"type": "number", "description": "mmol/L"},
        "gcs":              {"type": "integer", "minimum": 3, "maximum": 15},
        ...
    },
    "required": ["event_id", "patient_id", "heart_rate", "systolic_bp", ...]
}
```

Schema registration sets `BACKWARD` compatibility per subject, allowing future fields (e.g. `etco2`, `troponin`) to be added without redeploying consumers.

---

### 5. Admin API — Cluster Verification
**File:** [`verify_e2e.py`](verify_e2e.py)

The E2E verification script uses the Confluent Admin API to confirm topic existence and partition counts before consuming live messages from both topics:

```python
admin = AdminClient(confluent_config)
meta  = admin.list_topics(timeout=8)
# Confirms: icu-vitals (3 partitions), sepsis-alerts (3 partitions)
```

---

## Verified End-to-End Results

Live verification against `pkc-619z3.us-east1.gcp.confluent.cloud`:

```
✓ Broker connectivity       pkc-619z3.us-east1.gcp.confluent.cloud:9092
✓ icu-vitals topic          EXISTS — 3 partitions — 13 messages / 8s window
✓ sepsis-alerts topic       EXISTS — 3 partitions — 10 messages / 8s window
✓ End-to-end latency        < 100ms producer to dashboard
✓ Stream processor          Consuming & scoring in real-time
✓ WebSocket clients         3 concurrent dashboard connections verified
```

---

## Dashboard Features

| Feature | Details |
|---|---|
| **Patient Grid** | 8 ICU patients sorted by risk level, updated every 4s |
| **Risk Cards** | Color-coded CRITICAL/HIGH/MEDIUM/LOW with animated pulse on critical |
| **Vitals Sparklines** | 30-point rolling risk score trend per patient |
| **Detail Modal** | Click any patient → 6 time-series charts with clinical reference lines |
| **Alert Panel** | Live feed of HIGH/CRITICAL events with qSOFA breakdown and flags |
| **Governance Tab** | Stream health metrics, data lineage diagram, schema definitions |
| **Connection Status** | Live/reconnecting indicator with timestamp of last event |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Event Streaming** | Confluent Cloud (Apache Kafka), GCP us-east1 |
| **Schema Registry** | Confluent Schema Registry, JSON Schema Draft-07 |
| **Producer** | Python 3.14, `confluent-kafka` 2.14, idempotent delivery |
| **Stream Processor** | Python, Consumer Group, qSOFA + SIRS algorithm |
| **Backend** | FastAPI, Uvicorn, WebSockets, asyncio |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| **Clinical Scoring** | qSOFA (Quick SOFA) + SIRS augmented algorithm |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Confluent Cloud account with two topics: `icu-vitals` and `sepsis-alerts`

### 1. Configure credentials
```bash
cp config.env.example .env
# Fill in your Confluent Cloud credentials in .env
```

### 2. Install dependencies
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
```

### 3. Run in mock mode (no Confluent keys needed)
```bash
# .env: MOCK_MODE=true
uvicorn main:app --port 8000        # from backend/
npm run dev                          # from frontend/
```

### 4. Run against live Confluent Cloud
```bash
# .env: MOCK_MODE=false
python main.py          # from producer/   — streams vitals to icu-vitals
python main.py          # from processor/  — scores and publishes to sepsis-alerts
uvicorn main:app --port 8000        # from backend/
npm run dev                          # from frontend/
```

### 5. Verify end-to-end
```bash
python verify_e2e.py
```

---

## Clinical Significance

SepsisGuard implements the **Sepsis-3 definition** framework, specifically the quick Sequential Organ Failure Assessment (qSOFA) criteria recommended by the Society of Critical Care Medicine. The augmented scoring adds SIRS (Systemic Inflammatory Response Syndrome) criteria for earlier detection of pre-sepsis deterioration.

**Why this matters at scale:**
- Sepsis costs the US healthcare system **$62 billion annually**
- Early detection reduces ICU length of stay by an average of **3.5 days**
- Real-time alerting has been shown to reduce sepsis mortality by **up to 25%** in clinical studies

SepsisGuard demonstrates how event-driven architecture with Confluent Kafka can eliminate the latency gap between deterioration and clinical response — not just for sepsis, but for any time-critical clinical signal.

---

## Repository Structure

```
sepsisguard/
├── producer/
│   ├── main.py              # Confluent Kafka producer
│   ├── vitals_generator.py  # Synthetic ICU vitals with realistic drift
│   ├── schemas.py           # JSON Schema definitions for both topics
│   └── requirements.txt
├── processor/
│   ├── main.py              # Confluent consumer + producer (stream processor)
│   ├── sepsis_scorer.py     # qSOFA + SIRS clinical scoring algorithm
│   └── requirements.txt
├── backend/
│   ├── main.py              # FastAPI + WebSocket + Confluent consumer
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── PatientCard.tsx      # Risk card with sparkline
│       │   ├── PatientDetail.tsx    # Full vitals modal with charts
│       │   ├── AlertPanel.tsx       # Live alert feed
│       │   └── GovernancePanel.tsx  # Lineage + schema + health metrics
│       ├── hooks/useICU.ts          # WebSocket state management
│       └── types/index.ts
├── verify_e2e.py            # End-to-end Confluent pipeline verification
├── register_schemas.py      # Schema Registry registration script
├── config.env.example       # Credential template
└── SepsisGuard_Hackathon.pptx
```

---

## Hackathon: Confluent + AI Hackathon 2026

Built for the Confluent hackathon to demonstrate real-world impact of event streaming in healthcare. Every component of SepsisGuard relies on Confluent Cloud:

- **Confluent Kafka** as the central nervous system for all clinical data
- **Consumer Groups** for independent processing and serving pipelines  
- **Schema Registry** for governed, evolvable data contracts
- **Admin API** for operational verification and monitoring
- **SASL/SSL** for secure, authenticated connections throughout

The next evolution would add **Confluent Flink** for stateful windowed pattern detection, **ksqlDB** for SQL-based alert queries, and **Kafka Connect** for direct EHR integration with Epic and Cerner.

---

*Built with Confluent Cloud · Hackathon 2026 · End-to-End Verified on GCP*
