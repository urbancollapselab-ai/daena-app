#!/usr/bin/env python3
"""
Daena Memory Manager v2.0
=========================
Tiered memory system with vector search integration:
  HOT (RAM) → WARM (cache) → COLD (disk) → VECTOR (semantic search)

Changes from v1.0:
  - VectorMemory integration for semantic search
  - ContextManager integration for token-aware context windows
  - Learned facts now also stored in vector memory
"""

import json
import time
from pathlib import Path
from typing import Optional, List

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
WARM_FILE = DATA_DIR / "warm_memory.jsonl"
LEARNED_FILE = DATA_DIR / "learned_facts.jsonl"

# Import new modules (graceful fallback)
try:
    from scripts.vector_memory import VectorMemory
    _vmem = VectorMemory()
    _has_vector = True
except Exception:
    _vmem = None
    _has_vector = False

try:
    from scripts.context_manager import ContextManager
    _ctx = ContextManager(max_tokens=8000, summary_threshold=6000)
    _has_context = True
except Exception:
    _ctx = None
    _has_context = False


class MemoryManager:
    def __init__(self):
        self._hot: List[dict] = []  # Last N messages, in RAM
        self._max_hot = 20  # Increased from 10 to 20
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def add_hot(self, role: str, content: str, agent: str = None):
        entry = {
            "role": role,
            "content": content[:500],  # Cap message size
            "ts": time.time(),
            "agent": agent,
        }
        self._hot.append(entry)
        if len(self._hot) > self._max_hot:
            evicted = self._hot.pop(0)
            self._save_warm(evicted)

        # Also store in vector memory for semantic search
        if _has_vector and _vmem:
            try:
                _vmem.store(role, content, agent=agent)
            except Exception:
                pass

        # Also feed to context manager
        if _has_context and _ctx:
            try:
                _ctx.add(role, content, agent=agent)
            except Exception:
                pass

    def _save_warm(self, entry: dict):
        with open(WARM_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def get_context(self, task: str = "", agent: str = None, max_tokens: int = 500) -> str:
        """Get context combining HOT memory, cold context, semantic search, and facts."""
        parts = []

        # 1. Context Manager (token-optimized) if available
        if _has_context and _ctx:
            ctx_window = _ctx.get_context_window()
            if ctx_window:
                parts.append(ctx_window)
        else:
            # Fallback: HOT memory (recent conversation)
            if self._hot:
                recent = self._hot[-5:]
                conv = "\n".join(f"{m['role']}: {m['content'][:100]}" for m in recent)
                parts.append(f"Recent conversation:\n{conv}")

        # 2. COLD: agent context
        if agent:
            cold = self._load_cold(agent)
            if cold:
                parts.append(f"Agent context ({agent}):\n{cold[:300]}")

        # 3. VECTOR: semantic search for relevant past context
        if _has_vector and _vmem and task:
            try:
                vector_results = _vmem.search(task, limit=3, min_score=0.4)
                if vector_results:
                    semantic = "\n".join(
                        f"- [{r['role']}] {r['content'][:150]}" for r in vector_results
                    )
                    parts.append(f"Relevant past context:\n{semantic}")
            except Exception:
                pass

        # 4. Learned facts
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

        # Also store in vector memory
        if _has_vector and _vmem:
            try:
                _vmem.store("system", f"Learned fact: {fact}", tags=tags)
            except Exception:
                pass

    def get_stats(self) -> dict:
        """Get memory statistics."""
        stats = {
            "hot_messages": len(self._hot),
            "max_hot": self._max_hot,
            "has_vector_memory": _has_vector,
            "has_context_manager": _has_context,
        }
        if _has_vector and _vmem:
            stats["vector_count"] = _vmem.get_count()
        if _has_context and _ctx:
            stats["context_stats"] = _ctx.get_stats()
        return stats
