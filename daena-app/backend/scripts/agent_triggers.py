#!/usr/bin/env python3
"""
Daena Agent Triggers v1.0
=========================
Autonomous agent-to-agent trigger chains and scheduled tasks.
"""

import json
import time
from pathlib import Path
from typing import List, Optional
from datetime import datetime

ROOT = Path(__file__).parent.parent

TRIGGER_CHAINS = [
    {
        "name": "lead_to_outreach",
        "from": "data",
        "to": "sales",
        "condition_keywords": ["lead", "prospect", "contact found"],
        "message_template": "New lead detected: {details}. Start outreach sequence.",
    },
    {
        "name": "competitor_to_strategy",
        "from": "research",
        "to": "marketing",
        "condition_keywords": ["competitor", "rakip", "market shift"],
        "message_template": "Competitor intelligence update: {details}. Review marketing strategy.",
    },
    {
        "name": "late_invoice_alert",
        "from": "finance",
        "to": "main_brain",
        "condition_keywords": ["overdue", "gecikmiş", "unpaid", "late payment"],
        "message_template": "⚠️ Late invoice alert: {details}",
    },
    {
        "name": "error_restart",
        "from": "watchdog",
        "to": "coordinator",
        "condition_keywords": ["error", "crash", "down", "hata"],
        "message_template": "System error detected: {details}. Initiating recovery.",
    },
    {
        "name": "deal_to_invoice",
        "from": "sales",
        "to": "finance",
        "condition_keywords": ["accepted", "kabul", "deal closed", "won"],
        "message_template": "Deal closed! Create invoice for: {details}",
    },
]

SCHEDULED_TRIGGERS = [
    {"time": "08:30", "agent": "coordinator", "task": "Generate morning summary report"},
    {"time": "13:30", "agent": "watchdog", "task": "Run midday health check on all systems"},
    {"time": "20:30", "agent": "coordinator", "task": "Generate evening summary report"},
]


class TriggerEngine:
    def __init__(self):
        self._state_file = ROOT / "data" / "trigger_state.json"
        self._state = self._load_state()

    def _load_state(self) -> dict:
        if self._state_file.exists():
            return json.loads(self._state_file.read_text())
        return {"last_check": 0, "fired_today": []}

    def _save_state(self):
        self._state_file.parent.mkdir(parents=True, exist_ok=True)
        self._state_file.write_text(json.dumps(self._state, indent=2))

    def check_message_triggers(self, from_agent: str, message: str) -> List[dict]:
        fired = []
        msg_lower = message.lower()

        for chain in TRIGGER_CHAINS:
            if chain["from"] != from_agent:
                continue
            for keyword in chain["condition_keywords"]:
                if keyword in msg_lower:
                    trigger = {
                        "id": f"trig_{int(time.time() * 1000)}",
                        "chain": chain["name"],
                        "from": chain["from"],
                        "to": chain["to"],
                        "message": chain["message_template"].format(details=message[:100]),
                        "timestamp": datetime.now().isoformat(),
                        "type": "chain",
                    }
                    fired.append(trigger)
                    break

        return fired

    def check_scheduled_triggers(self) -> List[dict]:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        today = now.strftime("%Y-%m-%d")
        fired = []

        for sched in SCHEDULED_TRIGGERS:
            trigger_id = f"{sched['time']}_{today}"
            if trigger_id in self._state.get("fired_today", []):
                continue
            if current_time == sched["time"]:
                trigger = {
                    "id": f"sched_{int(time.time() * 1000)}",
                    "agent": sched["agent"],
                    "task": sched["task"],
                    "timestamp": datetime.now().isoformat(),
                    "type": "scheduled",
                }
                fired.append(trigger)
                self._state.setdefault("fired_today", []).append(trigger_id)

        if today != self._state.get("today"):
            self._state["today"] = today
            self._state["fired_today"] = []

        self._save_state()
        return fired
