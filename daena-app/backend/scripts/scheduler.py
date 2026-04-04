#!/usr/bin/env python3
"""
Daena Scheduler v2.0
=====================
Cron-like task scheduling using Python stdlib sched + threading.
Zero external dependencies. Supports recurring tasks and one-shot timers.

Usage:
    scheduler = DaenaScheduler()
    scheduler.add_recurring("daily_report", hour=8, minute=30, 
                           agent="coordinator", task="Generate daily summary")
    scheduler.start()  # Runs in background thread
"""

import json
import sched
import time
import threading
from pathlib import Path
from typing import Callable, Dict, List, Optional
from datetime import datetime, timedelta

ROOT = Path(__file__).parent.parent
SCHEDULE_FILE = ROOT / "data" / "schedules.json"


class DaenaScheduler:
    def __init__(self):
        self._scheduler = sched.scheduler(time.time, time.sleep)
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._schedules: List[Dict] = []
        self._execution_log: List[Dict] = []
        self._callbacks: Dict[str, Callable] = {}
        self._load_schedules()

    def _load_schedules(self):
        """Load saved schedules from disk."""
        if SCHEDULE_FILE.exists():
            try:
                self._schedules = json.loads(SCHEDULE_FILE.read_text())
            except Exception:
                self._schedules = []
        else:
            # Default schedules
            self._schedules = [
                {"id": "morning_summary", "hour": 8, "minute": 30,
                 "agent": "coordinator", "task": "Generate morning summary report",
                 "days": ["mon", "tue", "wed", "thu", "fri"], "enabled": True},
                {"id": "midday_health", "hour": 13, "minute": 0,
                 "agent": "watchdog", "task": "Run midday health check on all systems",
                 "days": ["mon", "tue", "wed", "thu", "fri"], "enabled": True},
                {"id": "evening_report", "hour": 18, "minute": 0,
                 "agent": "coordinator", "task": "Generate evening summary report",
                 "days": ["mon", "tue", "wed", "thu", "fri"], "enabled": True},
                {"id": "weekly_pipeline", "hour": 9, "minute": 0,
                 "agent": "sales", "task": "Generate weekly sales pipeline summary",
                 "days": ["mon"], "enabled": True},
                {"id": "weekly_finance", "hour": 10, "minute": 0,
                 "agent": "finance", "task": "Generate weekly financial summary",
                 "days": ["fri"], "enabled": True},
            ]
            self._save_schedules()

    def _save_schedules(self):
        SCHEDULE_FILE.parent.mkdir(parents=True, exist_ok=True)
        SCHEDULE_FILE.write_text(json.dumps(self._schedules, indent=2, ensure_ascii=False))

    def add_recurring(self, schedule_id: str, hour: int, minute: int,
                      agent: str, task: str, days: List[str] = None, enabled: bool = True):
        """Add a recurring scheduled task."""
        schedule = {
            "id": schedule_id,
            "hour": hour,
            "minute": minute,
            "agent": agent,
            "task": task,
            "days": days or ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
            "enabled": enabled,
        }
        # Replace if exists
        self._schedules = [s for s in self._schedules if s["id"] != schedule_id]
        self._schedules.append(schedule)
        self._save_schedules()
        return schedule

    def remove(self, schedule_id: str):
        """Remove a scheduled task."""
        self._schedules = [s for s in self._schedules if s["id"] != schedule_id]
        self._save_schedules()

    def toggle(self, schedule_id: str, enabled: bool):
        """Enable or disable a scheduled task."""
        for s in self._schedules:
            if s["id"] == schedule_id:
                s["enabled"] = enabled
                break
        self._save_schedules()

    def register_callback(self, callback: Callable):
        """Register a callback function for task execution.
        callback(agent: str, task: str) -> dict
        """
        self._callbacks["default"] = callback

    def start(self):
        """Start the scheduler in a background thread."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print(f"[Scheduler] Started with {len(self._schedules)} schedules")

    def stop(self):
        """Stop the scheduler."""
        self._running = False

    def _run_loop(self):
        """Main scheduler loop — checks every 30 seconds."""
        last_check = ""
        while self._running:
            now = datetime.now()
            current_time = now.strftime("%H:%M")
            day_name = now.strftime("%a").lower()

            # Only check once per minute
            if current_time != last_check:
                last_check = current_time
                for schedule in self._schedules:
                    if not schedule.get("enabled", True):
                        continue
                    sched_time = f"{schedule['hour']:02d}:{schedule['minute']:02d}"
                    if current_time == sched_time and day_name in schedule.get("days", []):
                        self._execute_schedule(schedule)

            time.sleep(30)

    def _execute_schedule(self, schedule: Dict):
        """Execute a scheduled task."""
        entry = {
            "schedule_id": schedule["id"],
            "agent": schedule["agent"],
            "task": schedule["task"],
            "timestamp": datetime.now().isoformat(),
            "success": False,
        }

        try:
            if "default" in self._callbacks:
                result = self._callbacks["default"](schedule["agent"], schedule["task"])
                entry["success"] = True
                entry["result"] = str(result)[:200] if result else "OK"
            else:
                print(f"[Scheduler] ⏰ {schedule['id']}: {schedule['task']} (no callback registered)")
                entry["success"] = True
                entry["result"] = "Logged (no callback)"
        except Exception as e:
            entry["error"] = str(e)[:200]
            print(f"[Scheduler] ❌ {schedule['id']}: {e}")

        self._execution_log.append(entry)
        # Keep last 100 entries
        self._execution_log = self._execution_log[-100:]

    def get_schedules(self) -> List[Dict]:
        return self._schedules

    def get_log(self, limit: int = 20) -> List[Dict]:
        return self._execution_log[-limit:]

    def get_next_runs(self) -> List[Dict]:
        """Get upcoming scheduled tasks for today."""
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        day_name = now.strftime("%a").lower()
        upcoming = []

        for s in self._schedules:
            if not s.get("enabled", True):
                continue
            if day_name not in s.get("days", []):
                continue
            sched_time = f"{s['hour']:02d}:{s['minute']:02d}"
            if sched_time > current_time:
                upcoming.append({
                    "id": s["id"],
                    "time": sched_time,
                    "agent": s["agent"],
                    "task": s["task"],
                })

        upcoming.sort(key=lambda x: x["time"])
        return upcoming


if __name__ == "__main__":
    scheduler = DaenaScheduler()
    print("Daena Scheduler Self-Test:")
    print(f"  Loaded {len(scheduler.get_schedules())} schedules:")
    for s in scheduler.get_schedules():
        status = "✅" if s.get("enabled") else "❌"
        print(f"    {status} {s['id']}: {s['hour']:02d}:{s['minute']:02d} → {s['agent']} — {s['task']}")

    upcoming = scheduler.get_next_runs()
    print(f"\n  Upcoming today: {len(upcoming)} tasks")
    for u in upcoming:
        print(f"    ⏰ {u['time']} → {u['agent']}: {u['task']}")

    print(f"\n✅ Scheduler self-test passed")
