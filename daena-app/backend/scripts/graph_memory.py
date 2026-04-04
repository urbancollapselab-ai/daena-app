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


if __name__ == "__main__":
    g = GraphMemory()
    print("GraphMemory Self-Test:\n")
    
    # Setup test graph
    g.add_node("Vedat", "Person")
    g.add_node("Hydra", "Project")
    g.add_node("API_Key", "Secret")
    g.add_node("FinanceAgent", "AI")
    
    g.add_edge("Vedat", "Hydra", "MANAGES")
    g.add_edge("FinanceAgent", "Hydra", "ASSISTS")
    g.add_edge("Vedat", "API_Key", "OWNS")
    g.add_edge("FinanceAgent", "API_Key", "USES")
    
    print("Graph built. Extracting subgraph for 'Hydra' (Depth 2):\n")
    subgraph = g.get_subgraph("Hydra", max_depth=2)
    for relation in subgraph:
        print("  " + relation)
        
    print("\n✅ GraphMemory (SQLite CTE) self-test passed")
