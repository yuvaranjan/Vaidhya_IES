"""
MQTT client — the edge side of Seam B (T1 task 11, ~1.5h).

The EDGE SERVICE holds this connection, not the patient browser, because an
incoming doctor question has to drive the voicebot (STT/TTS/LLM) and all of that
lives here in FastAPI.

Non-negotiable settings, because they buy the delivery guarantee for free:
    qos=1, clean_session=False, stable client_id (vaidhya-edge-{jurisdiction})
The broker then queues undelivered QoS-1 messages across a disconnect.

De-dup on message_id with a capped set — QoS 1 is at-least-once, so duplicates
are expected, not a bug.
"""

from collections import deque

from config import get_settings
from contracts import edge_client_id

_seen_ids: deque[str] = deque(maxlen=200)
_seen_set: set[str] = set()


def is_duplicate(message_id: str) -> bool:
    if message_id in _seen_set:
        return True
    if len(_seen_ids) == _seen_ids.maxlen:
        _seen_set.discard(_seen_ids[0])
    _seen_ids.append(message_id)
    _seen_set.add(message_id)
    return False


class EdgeMqtt:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client_id = edge_client_id(self.settings.jurisdiction_id)
        self.connected = False

    def connect(self) -> None:
        # TODO(T1 task 11): paho.mqtt.client with transport="websockets", TLS,
        # clean_session=False, then subscribe to
        # vaidhya/consult/+/doctor_to_patient at qos=1.
        raise NotImplementedError("T1 task 11")

    def publish(self, topic: str, payload: dict, *, retain: bool = False) -> None:
        raise NotImplementedError("T1 task 11")

    def healthy(self) -> bool:
        return self.connected


mqtt = EdgeMqtt()
