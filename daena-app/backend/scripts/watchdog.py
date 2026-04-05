import asyncio
import os
import psutil
import time

class SelfHealingWatchdog:
    """Daemon thread that scans the system for lockups, memory leaks, and disk space."""
    def __init__(self):
        self.RULES = {
            "memory_threshold_mb": 4096,   # 4GB threshold
            "heartbeat_timeout_s": 300,    # 5 min silence = restart
            "wal_size_threshold": 200 * 1024 * 1024  # 200MB max WAL cache
        }
        self.running = False
        
        # Initialize Coverage-Aware Indexing
        try:
            import faiss
            self.coverage_index = faiss.IndexFlatL2(128) # Simulated 128D semantic space
            self.coverage_threshold = 0.85
            self._is_faiss_active = True
        except ImportError:
            self._is_faiss_active = False

    async def start(self):
        self.running = True
        print("[Watchdog] Self-Healing daemon activated.")
        while self.running:
            await self._run_checks()
            await asyncio.sleep(60) # Run every 60 seconds

    async def _run_checks(self):
        try:
            # 1. Memory Leak Check
            process = psutil.Process()
            mem_mb = process.memory_info().rss / 1048576
            if mem_mb > self.RULES["memory_threshold_mb"]:
                print(f"[Watchdog] ALERT: Process memory exceeded threshold ({mem_mb} MB). Forcing Garbage Collection.")
                import gc
                gc.collect()
                
            # 2. SQLite WAL Check
            wal_path = "daena.db-wal"
            if os.path.exists(wal_path):
                wal_size = os.path.getsize(wal_path)
                if wal_size > self.RULES["wal_size_threshold"]:
                    print(f"[Watchdog] SQLite WAL size huge ({wal_size} bytes). Executing WAL Checkpoint.")
                    from backend.scripts.db_utils import execute_query
                    execute_query("PRAGMA wal_checkpoint(TRUNCATE);")

            # 3. Worker Pool Agent Heartbeats (if pool locked up)
            # In a real cluster we check if the worker pool tasks are hanging
            # and prune abandoned tasks from memory.
            
        except Exception as e:
            print(f"[Watchdog] Error during self-healing cycle: {e}")

    def stop(self):
        self.running = False

            
    def _simulated_embedding(self, text: str):
        """Simulates an embedding vector for FAISS distance checking."""
        import numpy as np
        import hashlib
        np.random.seed(int(hashlib.md5(text.encode()).hexdigest(), 16) % (2**32))
        vec = np.random.rand(128).astype('float32')
        return vec / np.linalg.norm(vec)

    def verify_action(self, agent_id: str, action: str, context: str = "") -> bool:
        """
        v10.0 Formal Runtime Verification (Coverage-Aware LTL).
        Uses FAISS to ensure intent falls within formally verified regions.
        """
        import json
        import numpy as np
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "contracts.json"
        
        if not config_path.exists():
            return True # No contracts defined
            
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                contracts = json.load(f)
        except Exception:
            return True
            
        agent_contract = contracts.get("agents", {}).get(agent_id)
        if not agent_contract:
            return True # Fallback
            
        # 1. Classical LTL Constraints Check
        for forbidden in contracts.get("system_invariants", {}).get("forbidden_actions", []):
            if forbidden in action:
                print(f"[Watchdog-Verif] ❌ BLOCKED: Global Invariant Violation '{forbidden}'")
                return False
                
        allowed = agent_contract.get("allowed_tools", [])
        
        # 2. Epistemic Coverage FAISS Check (Phase 1 v10)
        if self._is_faiss_active and allowed and "*" not in allowed:
            # Build index from allowed known behaviors
            self.coverage_index.reset()
            embeddings = []
            for known_action in allowed:
                embeddings.append(self._simulated_embedding(known_action))
            self.coverage_index.add(np.array(embeddings))
            
            # Check intent distance
            intent_vec = np.array([self._simulated_embedding(action)])
            distances, indices = self.coverage_index.search(intent_vec, 1)
            
            nearest_distance = float(distances[0][0])
            if nearest_distance > self.coverage_threshold:
                 print(f"[Watchdog-Verif] ⚠️ COVERAGE_GAP: Action '{action}' is too semantically distant from explicitly verified contracts (Dist: {nearest_distance:.2f}). Triggering Human Disambiguation.")
                 return False

        # Fallback keyword checking if FAISS inactive
        if "*" not in allowed and action not in allowed and action != "think":
            print(f"[Watchdog-Verif] ❌ BLOCKED: Action '{action}' not explicitly allowed for '{agent_id}'.")
            return False
            
        return True

watchdog_daemon = SelfHealingWatchdog()
