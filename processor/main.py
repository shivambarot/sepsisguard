"""
Stream Processor: reads icu-vitals, scores for sepsis, writes to sepsis-alerts.
In mock mode this is imported directly by the backend.
"""
import json
import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
sys.path.insert(0, os.path.dirname(__file__))

from sepsis_scorer import score_vitals
logging.basicConfig(level=logging.INFO, format="%(asctime)s [PROCESSOR] %(message)s")
log = logging.getLogger(__name__)

MOCK_MODE    = os.getenv("MOCK_MODE", "true").lower() == "true"
BOOTSTRAP    = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS", "")
API_KEY      = os.getenv("CONFLUENT_API_KEY", "")
API_SECRET   = os.getenv("CONFLUENT_API_SECRET", "")
VITALS_TOPIC = os.getenv("VITALS_TOPIC", "icu-vitals")
ALERTS_TOPIC = os.getenv("ALERTS_TOPIC", "sepsis-alerts")
GROUP_ID     = "sepsis-processor-group"


def run_kafka():
    from confluent_kafka import Consumer, Producer, KafkaError

    consumer = Consumer({
        "bootstrap.servers":  BOOTSTRAP,
        "security.protocol":  "SASL_SSL",
        "sasl.mechanisms":    "PLAIN",
        "sasl.username":      API_KEY,
        "sasl.password":      API_SECRET,
        "group.id":           GROUP_ID,
        "auto.offset.reset":  "latest",
        "enable.auto.commit": True,
    })
    producer = Producer({
        "bootstrap.servers": BOOTSTRAP,
        "security.protocol": "SASL_SSL",
        "sasl.mechanisms":   "PLAIN",
        "sasl.username":     API_KEY,
        "sasl.password":     API_SECRET,
    })

    consumer.subscribe([VITALS_TOPIC])
    log.info("Subscribed to %s → scoring → %s", VITALS_TOPIC, ALERTS_TOPIC)

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                log.error("Consumer error: %s", msg.error())
                continue

            vitals = json.loads(msg.value().decode())
            alert  = score_vitals(vitals)

            producer.produce(
                ALERTS_TOPIC,
                key=alert["patient_id"],
                value=json.dumps(alert).encode(),
            )
            producer.poll(0)
            log.info("%-5s → %-8s score=%.2f qSOFA=%d flags=%s",
                     alert["patient_id"], alert["risk_level"],
                     alert["risk_score"], alert["qsofa_score"], alert["flags"])
    finally:
        consumer.close()


if __name__ == "__main__":
    if MOCK_MODE:
        log.info("Mock mode: processor runs inside the backend — nothing to do here.")
    else:
        run_kafka()
