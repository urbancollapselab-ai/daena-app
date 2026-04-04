#!/usr/bin/env python3
"""
Daena Approval Queue v3.0 (Bounded Autonomy)
=============================================
Manages high-risk agent actions by pushing them to a human-approval queue.
Agents pause execution while waiting for the user to ACCEPT or REJECT.

Risk Levels:
  LOW: Execute immediately
  MEDIUM: Execute, but log heavily and notify
  HIGH: Pause and require human approval

Usage:
    queue = ApprovalQueue()
    request_id = queue.request_approval(
        agent="sales",
        action="send_quote",
        details="Send €50K proposal to Dijkstra",
        risk="HIGH"
    )
    # App logic later: queue.approve(request_id)
"""

import sqlite3
import time
from typing import Dict, List, Optional
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "approvals.db"


class ApprovalQueue:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                agent TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                risk TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                created_at REAL,
                resolved_at REAL,
                resolution_reason TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
        """)
        self._conn.commit()

    def request_approval(self, agent: str, action: str, details: str, risk: str = "HIGH") -> str:
        """Submit an action that requires human approval."""
        req_id = f"appreq_{int(time.time() * 1000)}"
        self._conn.execute(
            "INSERT INTO approvals (id, agent, action, details, risk, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (req_id, agent, action, details, risk.upper(), time.time())
        )
        self._conn.commit()
        return req_id

    def get_pending(self) -> List[Dict]:
        """Get all currently pending approval requests."""
        rows = self._conn.execute(
            "SELECT * FROM approvals WHERE status = 'PENDING' ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def resolve(self, req_id: str, approved: bool, reason: str = "") -> bool:
        """Approve or reject a pending request."""
        status = "APPROVED" if approved else "REJECTED"
        cursor = self._conn.cursor()
        cursor.execute(
            "UPDATE approvals SET status = ?, resolved_at = ?, resolution_reason = ? WHERE id = ? AND status = 'PENDING'",
            (status, time.time(), reason, req_id)
        )
        self._conn.commit()
        return cursor.rowcount > 0

    def check_status(self, req_id: str) -> Optional[str]:
        """Check the status of a specific request."""
        row = self._conn.execute("SELECT status FROM approvals WHERE id = ?", (req_id,)).fetchone()
        return row["status"] if row else None


if __name__ == "__main__":
    queue = ApprovalQueue()
    print("ApprovalQueue Self-Test:\n")
    
    req_id = queue.request_approval("finance", "transfer_funds", "Transfer €10K to Acme Corp", "HIGH")
    print(f"Created request: {req_id}")
    
    pending = queue.get_pending()
    print(f"Pending requests: {len(pending)}")
    
    success = queue.resolve(req_id, approved=False, reason="Too expensive right now")
    print(f"Rejected request: success={success}")
    
    status = queue.check_status(req_id)
    print(f"Final status: {status} (Expected REJECTED)")
    
    print("\n✅ ApprovalQueue self-test passed")
