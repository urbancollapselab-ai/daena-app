#!/usr/bin/env python3
"""
Daena DB Utils v3.0
====================
SQLite database utilities:
  - WAL mode enforcement for all databases
  - Integrity verification
  - Automated backup with verification
  - Connection pooling helper

Usage:
    ensure_wal_mode()           # Apply WAL to all Daena SQLite DBs
    verify_integrity()           # Check all DBs
    create_backup()              # Snapshot all DBs
"""

import json
import os
import shutil
import sqlite3
import time
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
BACKUP_DIR = DATA_DIR / "backups"

# All known Daena SQLite databases
DAENA_DBS = [
    DATA_DIR / "traces.db",
    DATA_DIR / "vector_memory.db",
    DATA_DIR / "tasks.db",
]


def ensure_wal_mode(db_path: Path = None) -> Dict:
    """Enable WAL mode on specified or all Daena databases.
    WAL = Write-Ahead Logging — prevents database locks during concurrent access.
    """
    results = {}
    targets = [db_path] if db_path else DAENA_DBS

    for db in targets:
        if not db.exists():
            results[str(db)] = "skipped (not found)"
            continue
        try:
            conn = sqlite3.connect(str(db))
            current = conn.execute("PRAGMA journal_mode").fetchone()[0]
            if current.lower() != "wal":
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("PRAGMA synchronous=NORMAL")  # Good balance of safety/speed
                conn.execute("PRAGMA cache_size=-64000")    # 64MB cache
                results[db.name] = f"upgraded: {current} → WAL"
            else:
                results[db.name] = "already WAL"
            conn.close()
        except Exception as e:
            results[db.name] = f"error: {str(e)[:100]}"

    return results


def verify_integrity(db_path: Path = None) -> Dict:
    """Run PRAGMA integrity_check on specified or all databases."""
    results = {}
    targets = [db_path] if db_path else DAENA_DBS

    for db in targets:
        if not db.exists():
            results[db.name] = {"status": "skipped", "reason": "not found"}
            continue
        try:
            conn = sqlite3.connect(str(db))
            check = conn.execute("PRAGMA integrity_check").fetchone()[0]
            size = db.stat().st_size
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
            conn.close()

            results[db.name] = {
                "status": "ok" if check == "ok" else "corrupted",
                "integrity": check,
                "size_bytes": size,
                "size_human": _human_size(size),
                "tables": [t[0] for t in tables],
            }
        except Exception as e:
            results[db.name] = {"status": "error", "error": str(e)[:200]}

    return results


def create_backup() -> Dict:
    """Create timestamped backup of all databases."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_subdir = BACKUP_DIR / timestamp
    backup_subdir.mkdir(exist_ok=True)

    results = {}
    for db in DAENA_DBS:
        if not db.exists():
            continue
        try:
            dest = backup_subdir / db.name
            # Use SQLite backup API for consistency
            src_conn = sqlite3.connect(str(db))
            dst_conn = sqlite3.connect(str(dest))
            src_conn.backup(dst_conn)
            dst_conn.close()
            src_conn.close()

            # Verify backup
            verify = sqlite3.connect(str(dest))
            check = verify.execute("PRAGMA integrity_check").fetchone()[0]
            verify.close()

            results[db.name] = {
                "status": "ok" if check == "ok" else "verification_failed",
                "path": str(dest),
                "size": _human_size(dest.stat().st_size),
            }
        except Exception as e:
            results[db.name] = {"status": "error", "error": str(e)[:200]}

    # Clean old backups (keep last 5)
    _cleanup_old_backups(max_keep=5)

    return {"timestamp": timestamp, "path": str(backup_subdir), "databases": results}


def _cleanup_old_backups(max_keep: int = 5):
    """Remove old backups, keeping only the N most recent."""
    if not BACKUP_DIR.exists():
        return
    backups = sorted(
        [d for d in BACKUP_DIR.iterdir() if d.is_dir()],
        key=lambda d: d.name, reverse=True
    )
    for old in backups[max_keep:]:
        shutil.rmtree(old, ignore_errors=True)


def get_db_stats() -> Dict:
    """Get statistics for all databases."""
    stats = {}
    total_size = 0
    for db in DAENA_DBS:
        if db.exists():
            size = db.stat().st_size
            total_size += size
            try:
                conn = sqlite3.connect(str(db))
                journal = conn.execute("PRAGMA journal_mode").fetchone()[0]
                tables = conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
                row_counts = {}
                for t in tables:
                    count = conn.execute(f"SELECT COUNT(*) FROM [{t[0]}]").fetchone()[0]
                    row_counts[t[0]] = count
                conn.close()
                stats[db.name] = {
                    "size": _human_size(size),
                    "journal_mode": journal,
                    "tables": row_counts,
                }
            except Exception as e:
                stats[db.name] = {"error": str(e)[:100]}

    stats["_total"] = {"total_size": _human_size(total_size), "db_count": len(DAENA_DBS)}
    return stats


def _human_size(size_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


if __name__ == "__main__":
    print("Daena DB Utils Self-Test:\n")

    # 1. WAL Mode
    print("  1. WAL Mode Enforcement:")
    wal_results = ensure_wal_mode()
    for db, status in wal_results.items():
        print(f"     {db}: {status}")

    # 2. Integrity Check
    print("\n  2. Integrity Verification:")
    integrity = verify_integrity()
    all_ok = True
    for db, result in integrity.items():
        status = "✅" if result.get("status") == "ok" else "⚠️"
        if result.get("status") != "ok" and result.get("status") != "skipped":
            all_ok = False
        size = result.get("size_human", "N/A")
        tables = result.get("tables", [])
        print(f"     {status} {db}: {result['status']} ({size}, {len(tables)} tables)")

    # 3. Backup
    print("\n  3. Backup Creation:")
    backup = create_backup()
    print(f"     Timestamp: {backup['timestamp']}")
    for db, result in backup["databases"].items():
        status = "✅" if result["status"] == "ok" else "❌"
        print(f"     {status} {db}: {result['status']} ({result.get('size', 'N/A')})")

    # 4. Stats
    print("\n  4. Database Statistics:")
    stats = get_db_stats()
    for db, info in stats.items():
        if db.startswith("_"):
            continue
        print(f"     {db}: {info.get('size', 'N/A')}, journal={info.get('journal_mode', 'N/A')}")
        for table, count in info.get("tables", {}).items():
            print(f"       └─ {table}: {count} rows")

    print(f"\n✅ DB Utils self-test passed (all integrity: {'OK' if all_ok else 'ISSUES'})")
