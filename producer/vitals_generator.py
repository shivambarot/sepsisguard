import random
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal

PATIENT_PROFILES = [
    {"id": "P001", "name": "James Mitchell", "age": 67, "ward": "ICU-A", "condition": "stable"},
    {"id": "P002", "name": "Maria Santos",   "age": 54, "ward": "ICU-A", "condition": "deteriorating"},
    {"id": "P003", "name": "Robert Chen",    "age": 72, "ward": "ICU-B", "condition": "critical"},
    {"id": "P004", "name": "Linda Johnson",  "age": 61, "ward": "ICU-B", "condition": "stable"},
    {"id": "P005", "name": "David Okafor",   "age": 48, "ward": "ICU-C", "condition": "recovering"},
    {"id": "P006", "name": "Sarah Williams", "age": 79, "ward": "ICU-C", "condition": "deteriorating"},
    {"id": "P007", "name": "Michael Torres", "age": 55, "ward": "ICU-A", "condition": "stable"},
    {"id": "P008", "name": "Emily Zhang",    "age": 63, "ward": "ICU-B", "condition": "critical"},
]

# Baseline vitals per condition
CONDITION_BASELINES = {
    "stable": {
        "heart_rate":       (72, 3),
        "systolic_bp":      (118, 5),
        "diastolic_bp":     (76, 3),
        "spo2":             (97.5, 0.5),
        "temperature":      (37.0, 0.2),
        "respiratory_rate": (16, 1),
        "wbc":              (7.5, 1.0),
        "lactate":          (1.1, 0.2),
        "gcs":              (15, 0),
    },
    "deteriorating": {
        "heart_rate":       (105, 8),
        "systolic_bp":      (98, 6),
        "diastolic_bp":     (62, 4),
        "spo2":             (93.0, 1.0),
        "temperature":      (38.7, 0.3),
        "respiratory_rate": (24, 2),
        "wbc":              (14.0, 2.0),
        "lactate":          (2.8, 0.4),
        "gcs":              (13, 1),
    },
    "critical": {
        "heart_rate":       (128, 10),
        "systolic_bp":      (82, 8),
        "diastolic_bp":     (50, 5),
        "spo2":             (88.0, 2.0),
        "temperature":      (39.5, 0.4),
        "respiratory_rate": (30, 3),
        "wbc":              (18.0, 3.0),
        "lactate":          (5.2, 0.6),
        "gcs":              (10, 2),
    },
    "recovering": {
        "heart_rate":       (82, 4),
        "systolic_bp":      (110, 4),
        "diastolic_bp":     (70, 3),
        "spo2":             (96.0, 0.5),
        "temperature":      (37.3, 0.2),
        "respiratory_rate": (18, 1),
        "wbc":              (9.0, 1.0),
        "lactate":          (1.6, 0.3),
        "gcs":              (15, 0),
    },
}

# Track drift so patients slowly worsen / improve over time
_condition_drift: dict[str, float] = {}


def _sample(mean: float, std: float, min_val: float, max_val: float) -> float:
    return round(max(min_val, min(max_val, random.gauss(mean, std))), 1)


def generate_vitals(patient: dict, tick: int) -> dict:
    pid = patient["id"]
    condition = patient["condition"]
    base = CONDITION_BASELINES[condition]

    # Slow drift: deteriorating patients trend worse every 5 ticks
    drift = _condition_drift.get(pid, 0.0)
    if condition == "deteriorating" and tick % 5 == 0:
        drift = min(drift + 0.15, 1.0)
    elif condition == "recovering" and tick % 5 == 0:
        drift = max(drift - 0.05, 0.0)
    _condition_drift[pid] = drift

    def drifted(key: str, min_v: float, max_v: float, direction: int = 1) -> float:
        m, s = base[key]
        drifted_mean = m + direction * drift * s * 3
        return _sample(drifted_mean, s, min_v, max_v)

    hr   = drifted("heart_rate",       40, 200,  1)
    sbp  = drifted("systolic_bp",       60, 200, -1)
    dbp  = drifted("diastolic_bp",      40, 130, -1)
    spo2 = drifted("spo2",              70, 100, -1)
    temp = drifted("temperature",       35,  42,  1)
    rr   = drifted("respiratory_rate",   8,  50,  1)
    wbc  = drifted("wbc",                1,  30,  1)
    lac  = drifted("lactate",          0.5,  15,  1)
    gcs_m, gcs_s = base["gcs"]
    gcs  = int(max(3, min(15, round(random.gauss(gcs_m - drift * 3, gcs_s + drift)))))

    return {
        "event_id":         str(uuid.uuid4()),
        "patient_id":       pid,
        "patient_name":     patient["name"],
        "age":              patient["age"],
        "ward":             patient["ward"],
        "timestamp":        datetime.utcnow().isoformat() + "Z",
        "heart_rate":       hr,
        "systolic_bp":      sbp,
        "diastolic_bp":     dbp,
        "spo2":             spo2,
        "temperature":      temp,
        "respiratory_rate": rr,
        "wbc":              wbc,
        "lactate":          lac,
        "gcs":              gcs,
        "condition_hint":   condition,
    }
