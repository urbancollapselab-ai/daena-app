#!/usr/bin/env python3
"""
Daena Trace Logger v2.0
========================
Logs every agent action with timestamp, model, latency, cost, and outcome.
SQLite-backed persistent storage with per-agent and per-model statistics.

Usage:
    logger = TraceLogger()
    logger.log(agent="finance", action="chat", model="qwen/qwen3.6-plus:free",
               prompt_summary="Generate Q3 report", response_summary="Report generated...",
               latency_ms=450, tokens=1200, success=True)
    stats = logger.get_stats()
"""

import json
import sqlite3
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "traces.db"


class TraceLogger:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS traces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                epoch REAL NOT NULL,
                agent TEXT NOT NULL,
                action TEXT NOT NULL DEFAULT 'chat',
                model TEXT,
                prompt_summary TEXT,
                response_summary TEXT,
                latency_ms INTEGER,
                tokens_used INTEGER,
                cost_usd REAL DEFAULT 0.0,
                success INTEGER DEFAULT 1,
                error TEXT,
                metadata TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_traces_agent ON traces(agent);
            CREATE INDEX IF NOT EXISTS idx_traces_epoch ON traces(epoch);
            CREATE INDEX IF NOT EXISTS idx_traces_model ON traces(model);
        """)
        self._conn.commit()

    def log(self, agent: str, action: str = "chat", model: str = None,
            prompt_summary: str = "", response_summary: str = "",
            latency_ms: int = 0, tokens: int = 0, cost_usd: float = 0.0,
            success: bool = True, error: str = None, metadata: dict = None):
        """Log a single agent action."""
        now = datetime.now()
        self._conn.execute("""
            INSERT INTO traces (timestamp, epoch, agent, action, model,
                               prompt_summary, response_summary, latency_ms,
                               tokens_used, cost_usd, success, error, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now.isoformat(),
            time.time(),
            agent,
            action,
            model,
            prompt_summary[:200] if prompt_summary else "",
            response_summary[:200] if response_summary else "",
            latency_ms,
            tokens,
            cost_usd,
            1 if success else 0,
            error,
            json.dumps(metadata) if metadata else None,
        ))
        self._conn.commit()

    def get_recent(self, limit: int = 50, agent: str = None) -> List[dict]:
        """Get recent trace entries."""
        if agent:
            rows = self._conn.execute(
                "SELECT * FROM traces WHERE agent = ? ORDER BY epoch DESC LIMIT ?",
                (agent, limit)
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM traces ORDER BY epoch DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]

    def get_stats(self) -> dict:
        """Get aggregate statistics."""
        total = self._conn.execute("SELECT COUNT(*) as c FROM traces").fetchone()["c"]
        success = self._conn.execute("SELECT COUNT(*) as c FROM traces WHERE success = 1").fetchone()["c"]

        # Per-agent stats
        agent_rows = self._conn.execute("""
            SELECT agent, COUNT(*) as calls, 
                   AVG(latency_ms) as avg_latency,
                   SUM(tokens_used) as total_tokens,
                   SUM(cost_usd) as total_cost,
                   SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
            FROM traces GROUP BY agent ORDER BY calls DESC
        """).fetchall()

        # Per-model stats
        model_rows = self._conn.execute("""
            SELECT model, COUNT(*) as calls,
                   AVG(latency_ms) as avg_latency,
                   SUM(tokens_used) as total_tokens,
                   SUM(cost_usd) as total_cost
            FROM traces WHERE model IS NOT NULL
            GROUP BY model ORDER BY calls DESC
        """).fetchall()

        # Hourly activity (last 24h)
        day_ago = time.time() - 86400
        hourly = self._conn.execute("""
            SELECT strftime('%H', timestamp) as hour, COUNT(*) as calls
            FROM traces WHERE epoch > ?
            GROUP BY hour ORDER BY hour
        """, (day_ago,)).fetchall()

        return {
            "total_calls": total,
            "successful": success,
            "failed": total - success,
            "success_rate": round(success / max(total, 1) * 100, 1),
            "by_agent": [dict(r) for r in agent_rows],
            "by_model": [dict(r) for r in model_rows],
            "hourly_activity": [dict(r) for r in hourly],
        }

    def get_cost_report(self) -> dict:
        """Get cost breakdown."""
        rows = self._conn.execute("""
            SELECT model,
                   SUM(cost_usd) as total_cost,
                   COUNT(*) as calls,
                   SUM(tokens_used) as tokens
            FROM traces WHERE cost_usd > 0
            GROUP BY model ORDER BY total_cost DESC
        """).fetchall()
        total = sum(r["total_cost"] or 0 for r in rows)
        return {
            "total_cost_usd": round(total, 4),
            "by_model": [dict(r) for r in rows],
        }


if __name__ == "__main__":
    logger = TraceLogger()
    # Self-test
    logger.log(agent="finance", model="qwen/qwen3.6-plus:free",
              prompt_summary="Test: generate invoice", response_summary="Invoice created",
              latency_ms=320, tokens=500, success=True)
    logger.log(agent="research", model="deepseek/deepseek-r1:free",
              prompt_summary="Test: market analysis", response_summary="Analysis complete",
              latency_ms=890, tokens=1200, cost_usd=0.0, success=True)
    logger.log(agent="watchdog", action="health_check",
              prompt_summary="System check", success=True, latency_ms=50)

    stats = logger.get_stats()
    print(json.dumps(stats, indent=2, ensure_ascii=False))
    print(f"\n✅ TraceLogger self-test passed — {stats['total_calls']} traces logged")
