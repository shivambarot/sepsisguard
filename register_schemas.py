"""
Registers JSON schemas for icu-vitals and sepsis-alerts with Confluent Schema Registry.
Run once before starting the live pipeline.
"""
import json
import os
import sys
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "producer"))
from schemas import VITALS_SCHEMA, ALERT_SCHEMA

SR_URL    = os.getenv("SCHEMA_REGISTRY_URL")
SR_KEY    = os.getenv("SCHEMA_REGISTRY_API_KEY")
SR_SECRET = os.getenv("SCHEMA_REGISTRY_API_SECRET")
auth      = HTTPBasicAuth(SR_KEY, SR_SECRET)
headers   = {"Content-Type": "application/vnd.schemaregistry.v1+json"}

SUBJECTS = {
    "icu-vitals-value":    VITALS_SCHEMA,
    "sepsis-alerts-value": ALERT_SCHEMA,
}


def register(subject: str, schema: dict) -> int:
    payload = json.dumps({"schemaType": "JSON", "schema": json.dumps(schema)})
    url = f"{SR_URL}/subjects/{subject}/versions"
    r = requests.post(url, data=payload, headers=headers, auth=auth, timeout=10)
    if r.status_code in (200, 201):
        sid = r.json().get("id")
        print(f"  Registered '{subject}' → schema id {sid}")
        return sid
    elif r.status_code == 409:
        print(f"  '{subject}' already registered (schema unchanged)")
        return None
    else:
        print(f"  ERROR {r.status_code} for '{subject}': {r.text}")
        r.raise_for_status()


def set_compatibility(subject: str, level: str = "BACKWARD"):
    url = f"{SR_URL}/config/{subject}"
    r = requests.put(url, json={"compatibility": level}, headers=headers, auth=auth, timeout=10)
    if r.ok:
        print(f"  Compatibility for '{subject}' set to {level}")
    else:
        print(f"  WARNING: could not set compatibility for '{subject}': {r.text}")


def list_subjects() -> list[str]:
    r = requests.get(f"{SR_URL}/subjects", auth=auth, timeout=10)
    return r.json() if r.ok else []


if __name__ == "__main__":
    print(f"\nConnecting to Schema Registry: {SR_URL}\n")

    # Test connectivity
    r = requests.get(f"{SR_URL}/subjects", auth=auth, timeout=10)
    if not r.ok:
        print(f"Cannot reach Schema Registry: {r.status_code} {r.text}")
        sys.exit(1)
    print(f"Connected. Existing subjects: {r.json() or '(none)'}\n")

    # Register schemas
    print("Registering schemas...")
    for subject, schema in SUBJECTS.items():
        register(subject, schema)
        set_compatibility(subject, "BACKWARD")

    # Confirm
    print(f"\nAll subjects in registry: {list_subjects()}")
    print("\nSchema governance ready.")
