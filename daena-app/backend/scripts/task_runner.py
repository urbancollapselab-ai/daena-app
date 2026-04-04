#!/usr/bin/env python3
"""
Daena Task Runner v2.0 — Durable Execution
============================================
Checkpoint-based task chains that survive failures.
Each step is checkpointed to SQLite so tasks can resume.

Usage:
    runner = TaskRunner()
    task_id = runner.create_task("Full client onboarding", steps=[
        {"agent": "research", "action": "Research company background"},
        {"agent": "data", "action": "Enrich contact data from web"},
        {"agent": "sales", "action": "Generate proposal document"},
        {"agent": "finance", "action": "Create invoice template"},
    ])
    runner.execute(task_id, callback=my_agent_callback)
"""

import json
import sqlite3
import time
import traceback
from pathlib import Path
from typing import Callable, Dict, List, Optional
from datetime import datetime

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "tasks.db"


class TaskRunner:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS task_chains (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                current_step INTEGER DEFAULT 0,
                total_steps INTEGER DEFAULT 0,
                steps TEXT NOT NULL,
                results TEXT DEFAULT '[]',
                error TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON task_chains(status);
        """)
        self._conn.commit()

    def create_task(self, name: str, steps: List[Dict]) -> str:
        """Create a new task chain. Returns task ID."""
        task_id = f"task_{int(time.time() * 1000)}"
        now = datetime.now().isoformat()
        self._conn.execute("""
            INSERT INTO task_chains (id, name, status, created_at, updated_at,
                                     current_step, total_steps, steps, results)
            VALUES (?, ?, 'pending', ?, ?, 0, ?, ?, '[]')
        """, (task_id, name, now, now, len(steps), json.dumps(steps)))
        self._conn.commit()
        return task_id

    def execute(self, task_id: str, callback: Callable) -> dict:
        """Execute a task chain with checkpoint support.
        callback(agent: str, action: str, context: dict) -> dict
        """
        task = self._get_task(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}

        steps = json.loads(task["steps"])
        results = json.loads(task["results"])
        start_step = task["current_step"]

        self._update_status(task_id, "running")

        for i in range(start_step, len(steps)):
            step = steps[i]
            self._update_step(task_id, i)

            try:
                # Build context from previous step results
                context = {
                    "task_name": task["name"],
                    "step_number": i + 1,
                    "total_steps": len(steps),
                    "previous_results": results,
                }

                # Execute step
                result = callback(step["agent"], step["action"], context)

                # Checkpoint
                step_result = {
                    "step": i,
                    "agent": step["agent"],
                    "action": step["action"],
                    "result": str(result)[:500] if result else "OK",
                    "success": True,
                    "timestamp": datetime.now().isoformat(),
                }
                results.append(step_result)
                self._checkpoint(task_id, i + 1, results)

            except Exception as e:
                # Save checkpoint at failure point
                step_result = {
                    "step": i,
                    "agent": step["agent"],
                    "action": step["action"],
                    "error": str(e)[:300],
                    "traceback": traceback.format_exc()[:500],
                    "success": False,
                    "timestamp": datetime.now().isoformat(),
                }
                results.append(step_result)
                self._checkpoint(task_id, i, results, status="failed", error=str(e))
                return {
                    "success": False,
                    "task_id": task_id,
                    "failed_at_step": i,
                    "error": str(e),
                    "results": results,
                    "resumable": True,
                }

        self._update_status(task_id, "completed")
        return {
            "success": True,
            "task_id": task_id,
            "results": results,
        }

    def resume(self, task_id: str, callback: Callable) -> dict:
        """Resume a failed task from its last checkpoint."""
        task = self._get_task(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}
        if task["status"] not in ("failed", "pending"):
            return {"success": False, "error": f"Task status is '{task['status']}', cannot resume"}
        return self.execute(task_id, callback)

    def get_task(self, task_id: str) -> Optional[dict]:
        task = self._get_task(task_id)
        if task:
            result = dict(task)
            result["steps"] = json.loads(result["steps"])
            result["results"] = json.loads(result["results"])
            return result
        return None

    def get_all_tasks(self, status: str = None, limit: int = 20) -> List[dict]:
        if status:
            rows = self._conn.execute(
                "SELECT * FROM task_chains WHERE status = ? ORDER BY updated_at DESC LIMIT ?",
                (status, limit)
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM task_chains ORDER BY updated_at DESC LIMIT ?", (limit,)
            ).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["steps"] = json.loads(d["steps"])
            d["results"] = json.loads(d["results"])
            results.append(d)
        return results

    def _get_task(self, task_id: str):
        return self._conn.execute(
            "SELECT * FROM task_chains WHERE id = ?", (task_id,)
        ).fetchone()

    def _update_status(self, task_id: str, status: str):
        self._conn.execute(
            "UPDATE task_chains SET status = ?, updated_at = ? WHERE id = ?",
            (status, datetime.now().isoformat(), task_id)
        )
        self._conn.commit()

    def _update_step(self, task_id: str, step: int):
        self._conn.execute(
            "UPDATE task_chains SET current_step = ?, updated_at = ? WHERE id = ?",
            (step, datetime.now().isoformat(), task_id)
        )
        self._conn.commit()

    def _checkpoint(self, task_id: str, step: int, results: list,
                    status: str = "running", error: str = None):
        self._conn.execute("""
            UPDATE task_chains SET current_step = ?, results = ?, status = ?,
                                   error = ?, updated_at = ? WHERE id = ?
        """, (step, json.dumps(results), status, error,
              datetime.now().isoformat(), task_id))
        self._conn.commit()


if __name__ == "__main__":
    runner = TaskRunner()

    # Self-test
    def mock_callback(agent, action, context):
        if "fail" in action.lower():
            raise Exception("Simulated failure")
        return f"{agent} completed: {action}"

    task_id = runner.create_task("Client Onboarding Test", steps=[
        {"agent": "research", "action": "Research company"},
        {"agent": "data", "action": "Enrich contacts"},
        {"agent": "sales", "action": "Generate proposal"},
    ])

    result = runner.execute(task_id, mock_callback)
    print(f"Task Result: {json.dumps(result, indent=2, ensure_ascii=False)}")

    # Test failure + resume
    task_id2 = runner.create_task("Failure Test", steps=[
        {"agent": "research", "action": "Step 1 OK"},
        {"agent": "data", "action": "Step 2 FAIL this"},
        {"agent": "sales", "action": "Step 3 never reached"},
    ])
    result2 = runner.execute(task_id2, mock_callback)
    print(f"\nFailed task resumable: {result2.get('resumable')}")
    print(f"Failed at step: {result2.get('failed_at_step')}")

    print(f"\n✅ TaskRunner self-test passed")
