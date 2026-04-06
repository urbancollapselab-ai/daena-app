import asyncio
import os
import psutil
import time
import hashlib

class SelfHealingWatchdog:
    """Daemon thread that scans the system for lockups, memory leaks, and disk space."""
    def __init__(self):
        self.RULES = {
            "memory_threshold_mb": 2048,   # 2GB threshold (lowered for safety)
            "heartbeat_timeout_s": 300,    # 5 min silence = restart
            "wal_size_threshold": 200 * 1024 * 1024  # 200MB max WAL cache
        }
        self.running = False
        self._is_faiss_active = False
        self.coverage_index = None
        self.coverage_threshold = 0.85
        # Cache: agent_id -> (hash_of_allowed_tools, built_faiss_index)
        self._faiss_cache = {}

    def _ensure_faiss(self):
        """Lazy FAISS initialization — only when first needed."""
        if self.coverage_index is not None:
            return
        try:
            import faiss
            self.coverage_index = faiss.IndexFlatL2(384)
            self._is_faiss_active = True
        except ImportError:
            self._is_faiss_active = False

    async def start(self):
        self.running = True
        print("[Watchdog] Self-Healing daemon activated.")
        while self.running:
            await self._run_checks()
            await asyncio.sleep(120)  # Run every 120 seconds (was 60)

    async def _run_checks(self):
        try:
            process = psutil.Process()
            mem_mb = process.memory_info().rss / 1048576
            if mem_mb > self.RULES["memory_threshold_mb"]:
                print(f"[Watchdog] ALERT: Memory {mem_mb:.0f} MB > threshold. Running GC safely.")
                import gc
                # Set specific generation for lighter collection (avoids long GIL lock)
                gc.collect(generation=1)

            # SQLite WAL Check — use glob to find actual WAL files
            from pathlib import Path
            data_dir = Path(__file__).parent.parent / "data"
            for wal_file in data_dir.glob("*.db-wal"):
                try:
                    wal_size = wal_file.stat().st_size
                    if wal_size > self.RULES["wal_size_threshold"]:
                        print(f"[Watchdog] WAL {wal_file.name} is {wal_size} bytes. Checkpointing.")
                        from scripts.db_utils import execute_query
                        execute_query("PRAGMA wal_checkpoint(TRUNCATE);")
                except Exception:
                    pass

        except Exception as e:
            print(f"[Watchdog] Error during self-healing cycle: {e}")

    def stop(self):
        self.running = False

    def _get_embedding(self, text: str):
        """Generates embeddings using global singleton (no eager model load)."""
        import numpy as np
        from scripts.embedding_service import encode_text, has_real_embeddings_cached

        if has_real_embeddings_cached():
            vec = encode_text(text)
            if vec is not None:
                vec_np = np.array(vec, dtype='float32')
                return vec_np / np.linalg.norm(vec_np)

        # Deterministic fallback stub (no model load triggered)
        np.random.seed(int(hashlib.md5(text.encode()).hexdigest(), 16) % (2**32))
        vec = np.random.rand(384).astype('float32')
        return vec / np.linalg.norm(vec)

    def verify_action(self, agent_id: str, action: str, context: str = "") -> bool:
        """Runtime verification with CACHED FAISS index (no rebuild per call)."""
        import json
        import numpy as np
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "contracts.json"

        if not config_path.exists():
            return True

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                contracts = json.load(f)
        except Exception:
            return True

        agent_contract = contracts.get("agents", {}).get(agent_id)
        if not agent_contract:
            return True

        # 1. Classical LTL Constraints Check
        for forbidden in contracts.get("system_invariants", {}).get("forbidden_actions", []):
            if forbidden in action:
                print(f"[Watchdog-Verif] BLOCKED: Global Invariant Violation '{forbidden}'")
                return False

        allowed = agent_contract.get("allowed_tools", [])

        # 2. Epistemic Coverage FAISS Check — WITH CACHING
        self._ensure_faiss()
        if self._is_faiss_active and allowed and "*" not in allowed:
            # Build a cache key from the sorted allowed tools
            cache_key = hashlib.md5(json.dumps(sorted(allowed)).encode()).hexdigest()

            if self._faiss_cache.get(agent_id, (None,))[0] != cache_key:
                # Rebuild index only when allowed tools change
                import faiss
                index = faiss.IndexFlatL2(384)
                embeddings = []
                for known_action in allowed:
                    embeddings.append(self._get_embedding(known_action))
                index.add(np.array(embeddings))
                self._faiss_cache[agent_id] = (cache_key, index)

            _, cached_index = self._faiss_cache[agent_id]
            intent_vec = np.array([self._get_embedding(action)])
            distances, _ = cached_index.search(intent_vec, 1)

            nearest_distance = float(distances[0][0])
            if nearest_distance > self.coverage_threshold:
                print(f"[Watchdog-Verif] COVERAGE_GAP: '{action}' too distant (Dist: {nearest_distance:.2f}).")
                return False

        # Fallback keyword checking if FAISS inactive
        if "*" not in allowed and action not in allowed and action != "think":
            print(f"[Watchdog-Verif] BLOCKED: '{action}' not allowed for '{agent_id}'.")
            return False

        return True

watchdog_daemon = SelfHealingWatchdog()
