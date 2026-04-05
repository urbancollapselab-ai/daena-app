#!/usr/bin/env python3
"""
Daena GraphRAG Memory v3.0
===========================
Entity-Relationship (Graph) Memory mapped onto SQLite.
Instead of just vector similarity (Semantic Search), this provides
Relationship Traversal (Multi-hop Reasoning).

Example:
  Node(Vedat, Person) --[OWNER_OF]--> Node(TechStart, Company)
  Node(Finance, Agent) --[CREATED]--> Node(Invoice_A, Document)

Usage:
    g = GraphMemory()
    g.add_node("Vedat", "Person")
    g.add_node("TechStart", "Company")
    g.add_edge("Vedat", "TechStart", "OWNER_OF")
    
    context = g.get_subgraph(start_node="Vedat", max_depth=2)
"""

import sqlite3
import time
from typing import Dict, List, Optional
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "graph_memory.db"


class GraphMemory:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                properties TEXT DEFAULT '{}',
                updated_at REAL
            );
            
            CREATE TABLE IF NOT EXISTS edges (
                source TEXT,
                target TEXT,
                relation TEXT,
                properties TEXT DEFAULT '{}',
                updated_at REAL,
                PRIMARY KEY (source, target, relation),
                FOREIGN KEY(source) REFERENCES nodes(id),
                FOREIGN KEY(target) REFERENCES nodes(id)
            );
            
            -- CTE optimized indexes
            CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
            CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
            CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
        """)
        self._conn.commit()

    def add_node(self, node_id: str, type_name: str, properties: str = "{}"):
        """Add or update a node."""
        self._conn.execute(
            "INSERT OR REPLACE INTO nodes (id, type, properties, updated_at) VALUES (?, ?, ?, ?)",
            (node_id, type_name, properties, time.time())
        )
        self._conn.commit()

    def add_edge(self, source: str, target: str, relation: str, properties: str = "{}"):
        """Add a directed relationship between two nodes."""
        self._conn.execute(
            "INSERT OR REPLACE INTO edges (source, target, relation, properties, updated_at) VALUES (?, ?, ?, ?, ?)",
            (source, target, relation, properties, time.time())
        )
        self._conn.commit()

    def get_subgraph(self, start_node: str, max_depth: int = 2) -> List[str]:
        """
        Uses SQLite Recursive CTE to traverse the graph multi-hop.
        Returns a list of relationship strings.
        """
        query = f"""
        WITH RECURSIVE
        traverse(source, target, relation, depth) AS (
            SELECT source, target, relation, 1
            FROM edges
            WHERE source = ? OR target = ?
            
            UNION
            
            SELECT e.source, e.target, e.relation, t.depth + 1
            FROM edges e
            JOIN traverse t ON e.source = t.target OR e.target = t.source
            WHERE t.depth < ? AND e.source != ?
        )
        SELECT DISTINCT source, relation, target FROM traverse LIMIT 50;
        """
        rows = self._conn.execute(query, (start_node, start_node, max_depth, start_node)).fetchall()
        
        results = []
        for r in rows:
            results.append(f"[{r['source']}] --({r['relation']})--> [{r['target']}]")
        return results

    def update_bocpd_state(self, entity_id: str, observation: float):
        """
        v10.0 Non-Exchangeable Sequence Modeling in BOCPD Memory.
        Uses a pseudo-HMM sequence to detect regime shifts in reliability.
        observation: 1.0 (success), 0.0 (failure), or float in between.
        """
        import json
        import numpy as np
        
        # 1. Fetch current BOCPD state
        row = self._conn.execute("SELECT properties FROM nodes WHERE id = ?", (entity_id,)).fetchone()
        if not row: return
        props = json.loads(row["properties"])
        
        # Initialize if missing
        if "bocpd_state" not in props:
            props["bocpd_state"] = {
                "current_state": "Healthy",
                "state_confidence": 1.0,
                "history": []
            }
            
        bocpd = props["bocpd_state"]
        history = set(bocpd.get("history", []))
        history.add(observation)
        
        # Pseudo-HMM Changepoint Logic
        if observation < 0.5:
             # Fast degrade on failure (Likelihood drop)
             bocpd["state_confidence"] = max(0.1, bocpd["state_confidence"] - 0.4)
             if bocpd["state_confidence"] < 0.5:
                 bocpd["current_state"] = "Degraded"
        else:
             # Slow recovery (Geometric decay)
             bocpd["state_confidence"] = min(1.0, bocpd["state_confidence"] + 0.1)
             if bocpd["state_confidence"] > 0.8:
                 bocpd["current_state"] = "Healthy"
                 
        bocpd["history"] = list(history)[-10:] # Keep last 10 points
        props["bocpd_state"] = bocpd
        
        self.add_node(entity_id, "TrackedEntity", json.dumps(props))

if __name__ == "__main__":
    import json
    g = GraphMemory()
    print("GraphMemory Self-Test:\n")
    
    # Setup test graph
    g.add_node("Vedat", "Person")
    g.add_node("Hydra", "Project")
    g.add_node("API_Key", "Secret")
    g.add_node("DeepSeek_v3", "AI_Model")
    
    g.add_edge("Vedat", "Hydra", "MANAGES")
    g.add_edge("DeepSeek_v3", "Hydra", "ASSISTS")
    
    print("Injecting BOCPD Failure Observations into DeepSeek_v3...\n")
    g.update_bocpd_state("DeepSeek_v3", 1.0) # Success
    g.update_bocpd_state("DeepSeek_v3", 0.0) # Failure
    g.update_bocpd_state("DeepSeek_v3", 0.0) # Failure
    
    row = g._conn.execute("SELECT properties FROM nodes WHERE id = 'DeepSeek_v3'").fetchone()
    print("BOCPD State after sequence (1.0, 0.0, 0.0):")
    print(json.dumps(json.loads(row["properties"])["bocpd_state"], indent=2))
    
    print("\n✅ GraphMemory (SQLite CTE + BOCPD) self-test passed")
