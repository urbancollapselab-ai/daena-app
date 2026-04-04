#!/usr/bin/env python3
"""
Daena Message Bus v1.0
======================
Inter-agent communication system using JSONL file-based message passing.
"""

import json
import time
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).parent.parent
BUS_FILE = ROOT / "data" / "message_bus.jsonl"


class MessageBus:
    def __init__(self):
        BUS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not BUS_FILE.exists():
            BUS_FILE.write_text("")

    def send(self, from_agent: str, to_agent: str, message: str, priority: str = "normal") -> dict:
        entry = {
            "id": f"msg_{int(time.time() * 1000)}",
            "from": from_agent,
            "to": to_agent,
            "message": message,
            "priority": priority,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "read": False,
        }
        with open(BUS_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        return entry

    def get_messages(self, agent_id: str, unread_only: bool = True) -> List[dict]:
        if not BUS_FILE.exists():
            return []
        messages = []
        for line in BUS_FILE.read_text().splitlines():
            if not line.strip():
                continue
            try:
                msg = json.loads(line)
                if msg.get("to") == agent_id:
                    if unread_only and msg.get("read"):
                        continue
                    messages.append(msg)
            except json.JSONDecodeError:
                continue
        return messages

    def get_all_messages(self, limit: int = 50) -> List[dict]:
        if not BUS_FILE.exists():
            return []
        messages = []
        for line in BUS_FILE.read_text().splitlines():
            if not line.strip():
                continue
            try:
                messages.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return messages[-limit:]

    def get_stats(self) -> dict:
        messages = self.get_all_messages(limit=1000)
        by_agent = {}
        for msg in messages:
            sender = msg.get("from", "unknown")
            by_agent[sender] = by_agent.get(sender, 0) + 1
        return {
            "total_messages": len(messages),
            "by_agent": by_agent,
        }
