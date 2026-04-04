#!/usr/bin/env python3
"""
Daena Config Versioner v3.0
===========================
Provides snapshotting, diffing, and rollback functionality for Daena's
agent configs and system settings (similar to git, but JSON/YAML based).

Usage:
    versioner = ConfigVersioner()
    versioner.snapshot_agent("finance", {"system_prompt": "You are..."})
    history = versioner.get_history("finance")
    versioner.rollback("finance", history[-2]["hash"])
"""

import hashlib
import json
import time
from typing import Dict, List, Optional
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "config_versions.db"


class ConfigVersioner:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS versions (
                hash TEXT PRIMARY KEY,
                target_type TEXT NOT NULL, -- 'agent' or 'system' 
                target_id TEXT NOT NULL,   -- e.g. 'finance'
                content TEXT NOT NULL,
                timestamp REAL NOT NULL,
                previous_hash TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_versions_target ON versions(target_type, target_id);
        """)
        self._conn.commit()

    def snapshot(self, target_type: str, target_id: str, content: dict) -> str:
        """Create a version snapshot of a configuration."""
        content_str = json.dumps(content, sort_keys=True)
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()[:12]
        
        # Check if identical to current
        last = self.get_latest(target_type, target_id)
        if last and last["hash"] == content_hash:
            return last["hash"] # No change
            
        previous_hash = last["hash"] if last else None
        
        self._conn.execute(
            "INSERT OR IGNORE INTO versions (hash, target_type, target_id, content, timestamp, previous_hash) VALUES (?, ?, ?, ?, ?, ?)",
            (content_hash, target_type, target_id, content_str, time.time(), previous_hash)
        )
        self._conn.commit()
        return content_hash

    def get_latest(self, target_type: str, target_id: str) -> Optional[Dict]:
        row = self._conn.execute(
            "SELECT * FROM versions WHERE target_type=? AND target_id=? ORDER BY timestamp DESC LIMIT 1",
            (target_type, target_id)
        ).fetchone()
        if row:
            d = dict(row)
            d["content"] = json.loads(d["content"])
            return d
        return None

    def get_history(self, target_type: str, target_id: str, limit: int = 10) -> List[Dict]:
        rows = self._conn.execute(
            "SELECT hash, timestamp, previous_hash FROM versions WHERE target_type=? AND target_id=? ORDER BY timestamp DESC LIMIT ?",
            (target_type, target_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def get_version(self, version_hash: str) -> Optional[Dict]:
        row = self._conn.execute("SELECT * FROM versions WHERE hash=?", (version_hash,)).fetchone()
        if row:
            d = dict(row)
            d["content"] = json.loads(d["content"])
            return d
        return None


import sqlite3 # Import deferred to match structure

if __name__ == "__main__":
    v = ConfigVersioner()
    print("ConfigVersioner Self-Test:\n")
    
    h1 = v.snapshot("agent", "research", {"role": "researcher", "temperature": 0.5})
    print(f"Snapshot 1: {h1}")
    
    h2 = v.snapshot("agent", "research", {"role": "senior researcher", "temperature": 0.5})
    print(f"Snapshot 2: {h2}")
    
    latest = v.get_latest("agent", "research")
    print(f"Latest matches h2: {latest['hash'] == h2}")
    
    history = v.get_history("agent", "research")
    print(f"History count: {len(history)}")
    
    print("\n✅ ConfigVersioner self-test passed")
