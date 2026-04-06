import sqlite3
import json
import time
from contextlib import contextmanager

class AgentMessageBus:
    """
    SQLite WAL mode tabanlı, process-safe mesaj kuyruğu.
    Ajanlar arası trigger chain'leri inter-process'e taşır.
    """
    def __init__(self, db_path="daena_bus.db"):
        self.db_path = db_path
        self._init_schema()

    def _init_schema(self):
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_agent TEXT NOT NULL,
                    target_agent TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    consumed_at REAL,
                    status TEXT DEFAULT 'pending'
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_target_status
                ON messages(target_agent, status)
            """)

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def publish(self, source: str, target: str, event_type: str, payload: dict):
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO messages (source_agent, target_agent, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
                (source, target, event_type, json.dumps(payload), time.time())
            )

    def consume(self, agent_name: str, limit=10) -> list:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT id, source_agent, event_type, payload FROM messages WHERE target_agent=? AND status='pending' ORDER BY id LIMIT ?",
                (agent_name, limit)
            ).fetchall()
            if rows:
                ids = [r[0] for r in rows]
                placeholders = ",".join("?" * len(ids))
                conn.execute(
                    f"UPDATE messages SET status='consumed', consumed_at=? WHERE id IN ({placeholders})",
                    [time.time()] + ids
                )
            return [
                {"id": r[0], "source": r[1], "event_type": r[2], "payload": json.loads(r[3])}
                for r in rows
            ]
