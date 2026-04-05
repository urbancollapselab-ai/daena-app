#!/usr/bin/env python3
"""
Daena Counterfactual Energy Accounting (CEA) - v10.0
=====================================================
Measures the 'unused possibility field'.
When the system selects path A over path B and C, the epistemic energy of B and C is not discarded.
It is logged. If the energy of unchosen paths remains consistently high across successes,
it prevents "Epistemic Arrogance" (policy collapse into a single tunnel).
"""

import json
import sqlite3
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "counterfactual_energy.db"


class CounterfactualTracker:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS rejected_edges (
                task_id TEXT,
                chosen_edge TEXT,
                chosen_confidence REAL,
                rejected_edge TEXT,
                rejected_confidence REAL,
                timestamp REAL
            );
            CREATE INDEX IF NOT EXISTS idx_cea_task ON rejected_edges(task_id);
        """)
        self._conn.commit()

    def record_decision(self, task_id: str, chosen: dict, rejected: list):
        """
        Record the counterfactual energy of rejected paths.
        chosen: {"name": "Path_A", "confidence": 0.85}
        rejected: [{"name": "Path_B", "confidence": 0.81}, ...]
        """
        now = time.time()
        for alt in rejected:
            self._conn.execute(
                "INSERT INTO rejected_edges VALUES (?, ?, ?, ?, ?, ?)",
                (
                    task_id,
                    chosen["name"],
                    chosen["confidence"],
                    alt["name"],
                    alt["confidence"],
                    now
                )
            )
        self._conn.commit()

    def calculate_entropy_gradient(self, limit: int = 100) -> float:
        """
        Calculate the policy collapse risk.
        If the distance between chosen and rejected confidence approaches 0 rapidly, 
        we are highly divergent. If it expands infinitely, we are tunneling.
        Returns risk score 0.0 to 1.0
        """
        rows = self._conn.execute(
            "SELECT chosen_confidence, rejected_confidence FROM rejected_edges ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()

        if not rows:
            return 0.0

        differences = [r["chosen_confidence"] - r["rejected_confidence"] for r in rows]
        avg_diff = sum(differences) / len(differences)

        # High difference -> High Tunneling Risk (Arrogance)
        # We cap risk at 1.0. A diff of 0.5+ means extreme arrogance.
        risk = min(1.0, max(0.0, avg_diff * 2.0))
        return risk

    def get_alternative_path(self, task_id: str) -> dict:
        """
        THE REACTOR: If the chosen path fails (e.g. Rate Limit, Exception),
        this pulls the highest confidence rejected path from the same task context
        to instantly shift reality to the backup plan.
        """
        row = self._conn.execute(
            "SELECT rejected_edge, rejected_confidence FROM rejected_edges WHERE task_id = ? ORDER BY rejected_confidence DESC LIMIT 1",
            (task_id,)
        ).fetchone()
        
        if row:
            return {"name": row["rejected_edge"], "confidence": row["rejected_confidence"], "found": True}
        return {"found": False}


if __name__ == "__main__":
    print("Self-Test: Counterfactual Energy Accounting (CEA)\n")
    tracker = CounterfactualTracker()
    
    tracker.record_decision(
        task_id="task_001",
        chosen={"name": "Use_DeepSeek_Finance", "confidence": 0.90},
        rejected=[
            {"name": "Use_Local_RAG", "confidence": 0.88},
            {"name": "Ask_User_For_Data", "confidence": 0.45}
        ]
    )
    
    risk = tracker.calculate_entropy_gradient()
    print(f"Policy Collapse Risk (0.0 = Open Mind, 1.0 = Arrogant Tunnel): {risk:.2f}")
    
    if risk > 0.8:
        print("[Watchdog Warning] Policy collapse imminent. System is ignoring highly probable alternative realities.")
    else:
        print("Cognitive flexibility is optimal.")
        
    print("\nSimulating Path Failure...")
    backup = tracker.get_alternative_path("task_001")
    if backup["found"]:
        print(f"Reactor engaged! Pivoting to Alternative Reality: {backup['name']} (Stored Confidence: {backup['confidence']})")
    else:
        print("No alternative paths found.")
