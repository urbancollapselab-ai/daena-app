#!/usr/bin/env python3
"""
Daena Memory Manager v1.0
=========================
Tiered memory system: HOT (RAM) → WARM (cache) → COLD (disk)
"""

import json
import time
from pathlib import Path
from typing import Optional, List

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
WARM_FILE = DATA_DIR / "warm_memory.jsonl"
LEARNED_FILE = DATA_DIR / "learned_facts.jsonl"


class MemoryManager:
    def __init__(self):
        self._hot: List[dict] = []  # Last 10 messages, in RAM
        self._max_hot = 10
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def add_hot(self, role: str, content: str):
        self._hot.append({
            "role": role,
            "content": content[:500],  # Cap message size
            "ts": time.time(),
        })
        if len(self._hot) > self._max_hot:
            evicted = self._hot.pop(0)
            self._save_warm(evicted)

    def _save_warm(self, entry: dict):
        with open(WARM_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def get_context(self, task: str = "", agent: str = None, max_tokens: int = 500) -> str:
        parts = []

        # HOT: recent conversation
        if self._hot:
            recent = self._hot[-5:]  # Last 5 messages
            conv = "\n".join(f"{m['role']}: {m['content'][:100]}" for m in recent)
            parts.append(f"Recent conversation:\n{conv}")

        # COLD: agent context
        if agent:
            cold = self._load_cold(agent)
            if cold:
                parts.append(f"Agent context ({agent}):\n{cold[:300]}")

        # Learned facts
        facts = self._search_facts(task)
        if facts:
            parts.append(f"Relevant facts:\n" + "\n".join(f"- {f}" for f in facts[:3]))

        return "\n\n".join(parts)

    def _load_cold(self, agent: str) -> str:
        claude_md = ROOT / "agents" / agent / "CLAUDE.md"
        if claude_md.exists():
            lines = claude_md.read_text().splitlines()[:20]
            return "\n".join(lines)
        return ""

    def _search_facts(self, query: str) -> List[str]:
        if not LEARNED_FILE.exists():
            return []
        results = []
        query_words = set(query.lower().split())
        for line in LEARNED_FILE.read_text().splitlines()[-50:]:
            try:
                entry = json.loads(line)
                tags = set(entry.get("tags", []))
                if tags & query_words:
                    results.append(entry.get("fact", ""))
            except json.JSONDecodeError:
                continue
        return results[:5]

    def learn(self, fact: str, tags: List[str]):
        entry = {"fact": fact, "tags": tags, "ts": time.time()}
        with open(LEARNED_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
