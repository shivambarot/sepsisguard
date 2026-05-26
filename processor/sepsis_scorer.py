"""
Sepsis risk scoring using qSOFA + SIRS-inspired augmentation.

qSOFA (quick Sequential Organ Failure Assessment):
  - Respiratory rate >= 22/min  → +1
  - Systolic BP <= 100 mmHg     → +1
  - GCS < 15                    → +1
  qSOFA >= 2 indicates high sepsis risk.

Augmented score adds weight from lactate, SpO2, temperature, HR, WBC.
"""
import uuid
from datetime import datetime


def score_vitals(vitals: dict) -> dict:
    flags = []
    qsofa = 0
    aug_score = 0.0

    rr  = vitals.get("respiratory_rate", 16)
    sbp = vitals.get("systolic_bp", 120)
    gcs = vitals.get("gcs", 15)
    lac = vitals.get("lactate", 1.0)
    spo2= vitals.get("spo2", 98)
    temp= vitals.get("temperature", 37.0)
    hr  = vitals.get("heart_rate", 72)
    wbc = vitals.get("wbc", 7.5)

    # ── qSOFA criteria ────────────────────────────────────────────────────────
    if rr >= 22:
        qsofa += 1
        aug_score += 1.0
        flags.append("High respiratory rate (>=22/min)")
    if sbp <= 100:
        qsofa += 1
        aug_score += 1.0
        flags.append("Low systolic BP (<=100 mmHg)")
    if gcs < 15:
        qsofa += 1
        aug_score += 1.0
        flags.append(f"Altered mentation (GCS={gcs})")

    # ── Lactate (strong sepsis marker) ───────────────────────────────────────
    if lac >= 4.0:
        aug_score += 2.0
        flags.append(f"Critical lactate ({lac:.1f} mmol/L)")
    elif lac >= 2.0:
        aug_score += 1.0
        flags.append(f"Elevated lactate ({lac:.1f} mmol/L)")

    # ── SpO2 ─────────────────────────────────────────────────────────────────
    if spo2 < 90:
        aug_score += 1.5
        flags.append(f"Severe hypoxia (SpO2={spo2:.1f}%)")
    elif spo2 < 94:
        aug_score += 0.75
        flags.append(f"Low SpO2 ({spo2:.1f}%)")

    # ── Temperature (SIRS) ───────────────────────────────────────────────────
    if temp > 39.0 or temp < 36.0:
        aug_score += 0.75
        flags.append(f"Abnormal temperature ({temp:.1f}C)")

    # ── Heart rate (SIRS) ────────────────────────────────────────────────────
    if hr > 90:
        aug_score += 0.5
        flags.append(f"Tachycardia (HR={hr:.0f} bpm)")

    # ── WBC (SIRS) ───────────────────────────────────────────────────────────
    if wbc > 12.0:
        aug_score += 0.5
        flags.append(f"Leukocytosis (WBC={wbc:.1f} k/uL)")
    elif wbc < 4.0:
        aug_score += 0.5
        flags.append(f"Leukopenia (WBC={wbc:.1f} k/uL)")

    # ── Risk level ───────────────────────────────────────────────────────────
    if aug_score >= 5.0:
        risk_level = "CRITICAL"
    elif aug_score >= 3.0:
        risk_level = "HIGH"
    elif aug_score >= 1.5:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "alert_id":        str(uuid.uuid4()),
        "patient_id":      vitals["patient_id"],
        "patient_name":    vitals["patient_name"],
        "ward":            vitals["ward"],
        "timestamp":       datetime.utcnow().isoformat() + "Z",
        "risk_level":      risk_level,
        "risk_score":      round(aug_score, 2),
        "qsofa_score":     qsofa,
        "flags":           flags,
        "vitals_snapshot": {
            k: vitals[k] for k in [
                "heart_rate", "systolic_bp", "diastolic_bp",
                "spo2", "temperature", "respiratory_rate", "wbc", "lactate", "gcs",
            ]
        },
    }
