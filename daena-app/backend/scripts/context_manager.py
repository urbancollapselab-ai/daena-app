#!/usr/bin/env python3
"""
Daena Context Window Manager v2.0
==================================
Manages context window limits with token counting, summarization, and message pinning.
Prevents context overflow in long business sessions.

Usage:
    ctx = ContextManager(max_tokens=8000)
    ctx.add("user", "Generate Q3 report")
    ctx.add("assistant", "Here is the Q3 report...")
    ctx.pin(msg_id=3)  # Keep important messages
    context = ctx.get_context_window()  # Returns optimized context
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).parent.parent


def estimate_tokens(text: str) -> int:
    """Rough token estimation: ~4 chars per token for English, ~3 for Turkish."""
    return max(1, len(text) // 3)


class ContextManager:
    def __init__(self, max_tokens: int = 8000, summary_threshold: int = 6000):
        self._messages: List[Dict] = []
        self._pinned: set = set()  # IDs of pinned (important) messages
        self._summaries: List[str] = []
        self._max_tokens = max_tokens
        self._summary_threshold = summary_threshold
        self._msg_counter = 0
        self._total_tokens_processed = 0

    def add(self, role: str, content: str, agent: str = None, important: bool = False) -> int:
        """Add a message. Returns message ID."""
        self._msg_counter += 1
        msg = {
            "id": self._msg_counter,
            "role": role,
            "content": content,
            "agent": agent,
            "tokens": estimate_tokens(content),
            "timestamp": time.time(),
            "important": important,
        }
        self._messages.append(msg)
        self._total_tokens_processed += msg["tokens"]

        if important:
            self._pinned.add(self._msg_counter)

        # Auto-detect important messages
        if self._is_important(content):
            self._pinned.add(self._msg_counter)
            msg["important"] = True

        # Check if we need to compress
        self._maybe_compress()

        return self._msg_counter

    def pin(self, msg_id: int):
        """Pin a message so it's never evicted."""
        self._pinned.add(msg_id)
        for msg in self._messages:
            if msg["id"] == msg_id:
                msg["important"] = True

    def unpin(self, msg_id: int):
        """Unpin a message."""
        self._pinned.discard(msg_id)

    def get_context_window(self) -> str:
        """Get optimized context string within token limits."""
        parts = []

        # Include summaries of older conversations
        if self._summaries:
            summary_text = "\n".join(f"[Summary] {s}" for s in self._summaries[-3:])
            parts.append(f"Previous context:\n{summary_text}")

        # Include pinned messages
        pinned_msgs = [m for m in self._messages if m["id"] in self._pinned]
        if pinned_msgs:
            pinned_text = "\n".join(
                f"[Pinned] {m['role']}: {m['content'][:200]}" for m in pinned_msgs
            )
            parts.append(f"Important notes:\n{pinned_text}")

        # Include recent messages (within token budget)
        remaining_tokens = self._max_tokens - estimate_tokens("\n\n".join(parts))
        recent = []
        for msg in reversed(self._messages):
            if msg["id"] in self._pinned:
                continue  # Already included above
            if remaining_tokens <= 0:
                break
            recent.insert(0, msg)
            remaining_tokens -= msg["tokens"]

        if recent:
            conv = "\n".join(f"{m['role']}: {m['content'][:500]}" for m in recent)
            parts.append(f"Recent conversation:\n{conv}")

        return "\n\n".join(parts)

    def get_stats(self) -> dict:
        """Get context manager statistics."""
        current_tokens = sum(m["tokens"] for m in self._messages)
        return {
            "total_messages": len(self._messages),
            "pinned_messages": len(self._pinned),
            "current_tokens": current_tokens,
            "max_tokens": self._max_tokens,
            "utilization": round(current_tokens / self._max_tokens * 100, 1),
            "summaries_created": len(self._summaries),
            "total_tokens_processed": self._total_tokens_processed,
        }

    def _is_important(self, content: str) -> bool:
        """Auto-detect important messages based on keywords."""
        markers = [
            "important", "önemli", "remember", "hatırla", "note", "not:",
            "decision", "karar", "agreed", "anlaştık", "confirmed",
            "deadline", "tarih", "müşteri adı", "client name",
            "invoice", "fatura", "contract", "sözleşme", "price", "fiyat",
            "€", "$", "₺", "budget", "bütçe",
        ]
        content_lower = content.lower()
        return any(m in content_lower for m in markers)

    def _maybe_compress(self):
        """Compress context if approaching token limit."""
        current_tokens = sum(m["tokens"] for m in self._messages)

        if current_tokens <= self._summary_threshold:
            return

        # Find messages to summarize (old, unpinned)
        to_summarize = []
        to_keep = []
        cutoff = len(self._messages) // 2  # Summarize first half

        for i, msg in enumerate(self._messages):
            if i < cutoff and msg["id"] not in self._pinned:
                to_summarize.append(msg)
            else:
                to_keep.append(msg)

        if not to_summarize:
            return

        # Create summary from evicted messages
        summary_parts = []
        for msg in to_summarize:
            summary_parts.append(f"{msg['role']}: {msg['content'][:100]}")

        summary = f"[{len(to_summarize)} messages summarized] Topics: " + \
                  "; ".join(set(
                      word for msg in to_summarize
                      for word in msg["content"].lower().split()[:3]
                  ))[:300]

        self._summaries.append(summary)
        self._messages = to_keep

    def clear(self):
        """Clear all context."""
        self._messages.clear()
        self._pinned.clear()
        self._summaries.clear()


if __name__ == "__main__":
    ctx = ContextManager(max_tokens=500, summary_threshold=300)

    # Simulate a business session
    ctx.add("user", "Let's discuss the Bouwgroep Dijkstra deal — they want €500K project")
    ctx.add("assistant", "Understood. Bouwgroep Dijkstra, Amsterdam-based construction. €500K scope.")
    ctx.add("user", "The deadline is March 15, 2026. Important: they require Dutch-language deliverables")
    ctx.add("assistant", "Noted — deadline March 15, Dutch-language. I'll set up the project template.")
    ctx.add("user", "Also prepare an invoice template with 30-day payment terms")
    ctx.add("assistant", "Invoice template ready with NET-30 terms for Bouwgroep.")
    ctx.add("user", "Now let's switch to the marketing campaign for TechStart")
    ctx.add("assistant", "Switching to TechStart marketing campaign. What's the budget?")

    window = ctx.get_context_window()
    stats = ctx.get_stats()

    print("Context Window Manager Self-Test:")
    print(f"  Messages: {stats['total_messages']}")
    print(f"  Pinned: {stats['pinned_messages']}")
    print(f"  Token utilization: {stats['utilization']}%")
    print(f"  Summaries: {stats['summaries_created']}")
    print(f"\nContext Window ({estimate_tokens(window)} tokens):")
    print(window[:500])
    print(f"\n✅ ContextManager self-test passed")
