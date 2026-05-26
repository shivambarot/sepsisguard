"""
ICU Vitals Producer
Streams synthetic patient vitals to Confluent Kafka (or stdout in mock mode).
"""
import json
import os
import sys
import time
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from vitals_generator import PATIENT_PROFILES, generate_vitals

logging.basicConfig(level=logging.INFO, format="%(asctime)s [PRODUCER] %(message)s")
log = logging.getLogger(__name__)

MOCK_MODE        = os.getenv("MOCK_MODE", "true").lower() == "true"
BOOTSTRAP        = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS", "")
API_KEY          = os.getenv("CONFLUENT_API_KEY", "")
API_SECRET       = os.getenv("CONFLUENT_API_SECRET", "")
VITALS_TOPIC     = os.getenv("VITALS_TOPIC", "icu-vitals")
INTERVAL         = float(os.getenv("PRODUCER_INTERVAL_SECONDS", "4"))


def get_producer():
    if MOCK_MODE:
        return None
    from confluent_kafka import Producer
    return Producer({
        "bootstrap.servers":       BOOTSTRAP,
        "security.protocol":       "SASL_SSL",
        "sasl.mechanisms":         "PLAIN",
        "sasl.username":           API_KEY,
        "sasl.password":           API_SECRET,
        "client.id":               "sepsis-vitals-producer",
        "acks":                    "all",
        "enable.idempotence":      True,
    })


def delivery_report(err, msg):
    if err:
        log.error("Delivery failed for %s: %s", msg.key(), err)
    else:
        log.debug("Delivered %s [partition %d offset %d]", msg.topic(), msg.partition(), msg.offset())


def run():
    producer = get_producer()
    tick = 0
    log.info("Starting producer | mock=%s | topic=%s | interval=%.1fs", MOCK_MODE, VITALS_TOPIC, INTERVAL)

    while True:
        for patient in PATIENT_PROFILES:
            vitals = generate_vitals(patient, tick)
            payload = json.dumps(vitals)

            if MOCK_MODE:
                # Write to stdout so backend can read it via subprocess pipe
                print(payload, flush=True)
                log.info("Patient %-5s %-20s HR=%-3.0f BP=%3.0f/%2.0f SpO2=%.1f%% Lac=%.1f",
                         vitals["patient_id"], vitals["patient_name"],
                         vitals["heart_rate"], vitals["systolic_bp"], vitals["diastolic_bp"],
                         vitals["spo2"], vitals["lactate"])
            else:
                producer.produce(
                    VITALS_TOPIC,
                    key=vitals["patient_id"],
                    value=payload.encode(),
                    callback=delivery_report,
                )
                producer.poll(0)

        if not MOCK_MODE:
            producer.flush()

        tick += 1
        time.sleep(INTERVAL)


if __name__ == "__main__":
    run()
