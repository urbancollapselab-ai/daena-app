#!/usr/bin/env python3
"""
Daena Memory Manager v2.1
=========================
Tiered memory: HOT (RAM) → WARM (disk) → COLD (agent files) → VECTOR (semantic)
Thread-safe, bounded, with graceful degradation.
"""

import json
import time
import threading
from pathlib import Path
from typing import Optional, List

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
WARM_FILE = DATA_DIR / "warm_memory.jsonl"
LEARNED_FILE = DATA_DIR / "learned_facts.jsonl"
# Max WARM file size: 2MB — prevents unbounded disk growth
MAX_WARM_BYTES = 2 * 1024 * 1024

# ── Lazy singletons (no import-time side effects) ──
_vmem = None
_ctx = None
_init_lock = threading.Lock()
_initialized = False


def _ensure_initialized():
    """Lazy-init VectorMemory and ContextManager on first use."""
    global _vmem, _ctx, _initialized
    if _initialized:
        return
    with _init_lock:
        if _initialized:
            return
        try:
            from scripts.vector_memory import VectorMemory
            _vmem = VectorMemory()
        except Exception:
            _vmem = None
        try:
            from scripts.context_manager import ContextManager
            _ctx = ContextManager(max_tokens=8000, summary_threshold=6000)
        except Exception:
            _ctx = None
        _initialized = True


class MemoryManager:
    def __init__(self):
        self._hot: List[dict] = []
        self._max_hot = 20
        self._lock = threading.Lock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def add_hot(self, role: str, content: str, agent: str = None):
        _ensure_initialized()
        entry = {
            "role": role,
            "content": content[:500],
            "ts": time.time(),
            "agent": agent,
        }
        with self._lock:
            self._hot.append(entry)
            if len(self._hot) > self._max_hot:
                evicted = self._hot.pop(0)
                self._save_warm(evicted)

        if _vmem:
            try:
                _vmem.store(role, content, agent=agent)
            except Exception:
                pass
        if _ctx:
            try:
                _ctx.add(role, content, agent=agent)
            except Exception:
                pass

    def _save_warm(self, entry: dict):
        try:
            # Rotate warm file if it exceeds size limit
            if WARM_FILE.exists() and WARM_FILE.stat().st_size > MAX_WARM_BYTES:
                lines = WARM_FILE.read_text().splitlines()
                # Keep last half
                WARM_FILE.write_text("\n".join(lines[len(lines) // 2:]) + "\n")
            with open(WARM_FILE, "a") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

    def get_context(self, task: str = "", agent: str = None, max_tokens: int = 500) -> str:
        _ensure_initialized()
        parts = []

        if _ctx:
            ctx_window = _ctx.get_context_window()
            if ctx_window:
                parts.append(ctx_window)
        else:
            with self._lock:
                recent = list(self._hot[-5:])
            if recent:
                conv = "\n".join(f"{m['role']}: {m['content'][:100]}" for m in recent)
                parts.append(f"Recent conversation:\n{conv}")

        if agent:
            cold = self._load_cold(agent)
            if cold:
                parts.append(f"Agent context ({agent}):\n{cold[:300]}")

        if _vmem and task:
            try:
                results = _vmem.search(task, limit=3, min_score=0.4)
                if results:
                    semantic = "\n".join(f"- [{r['role']}] {r['content'][:150]}" for r in results)
                    parts.append(f"Relevant past context:\n{semantic}")
            except Exception:
                pass

        facts = self._search_facts(task)
        if facts:
            parts.append("Relevant facts:\n" + "\n".join(f"- {f}" for f in facts[:3]))

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
        try:
            for line in LEARNED_FILE.read_text().splitlines()[-50:]:
                try:
                    entry = json.loads(line)
                    tags = set(entry.get("tags", []))
                    if tags & query_words:
                        results.append(entry.get("fact", ""))
                except json.JSONDecodeError:
                    continue
        except Exception:
            pass
        return results[:5]

    def learn(self, fact: str, tags: List[str]):
        _ensure_initialized()
        entry = {"fact": fact, "tags": tags, "ts": time.time()}
        try:
            with open(LEARNED_FILE, "a") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass
        if _vmem:
            try:
                _vmem.store("system", f"Learned fact: {fact}", tags=tags)
            except Exception:
                pass

    def get_stats(self) -> dict:
        _ensure_initialized()
        stats = {
            "hot_messages": len(self._hot),
            "max_hot": self._max_hot,
            "has_vector_memory": _vmem is not None,
            "has_context_manager": _ctx is not None,
        }
        if _vmem:
            try:
                stats["vector_count"] = _vmem.get_count()
            except Exception:
                pass
        if _ctx:
            try:
                stats["context_stats"] = _ctx.get_stats()
            except Exception:
                pass
        return stats
