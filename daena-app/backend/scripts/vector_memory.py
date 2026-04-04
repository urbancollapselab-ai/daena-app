#!/usr/bin/env python3
"""
Daena Vector Memory v2.0
=========================
Semantic memory layer using sentence-transformers (all-MiniLM-L6-v2, 80MB)
with SQLite for vector storage and cosine similarity search.

Falls back to FTS5 keyword search if embedding model is not available.

Usage:
    vmem = VectorMemory()
    vmem.store("user", "We discussed the Dutch construction company Bouwgroep")
    results = vmem.search("that construction firm in Netherlands", limit=3)
"""

import json
import sqlite3
import time
import struct
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "vector_memory.db"

# Try loading sentence-transformers for real embeddings
_model = None
_embed_dim = 0
_use_embeddings = False

try:
    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    _embed_dim = 384  # MiniLM-L6-v2 outputs 384-dim vectors
    _use_embeddings = True
    print("[VectorMemory] ✅ Embedding model loaded (all-MiniLM-L6-v2, 384d)")
except ImportError:
    print("[VectorMemory] ⚠️ sentence-transformers not installed — falling back to FTS5 keyword search")
    print("[VectorMemory]    Install with: pip install sentence-transformers")


def _encode(text: str) -> Optional[bytes]:
    """Encode text to embedding vector bytes."""
    if not _use_embeddings or _model is None:
        return None
    vec = _model.encode(text, normalize_embeddings=True)
    return struct.pack(f"{len(vec)}f", *vec)


def _decode(data: bytes) -> List[float]:
    """Decode embedding bytes to float list."""
    n = len(data) // 4
    return list(struct.unpack(f"{n}f", data))


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    return dot  # Vectors are already normalized


class VectorMemory:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                epoch REAL NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                agent TEXT,
                embedding BLOB,
                tags TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_mem_epoch ON memories(epoch);
            CREATE INDEX IF NOT EXISTS idx_mem_role ON memories(role);
        """)
        # FTS5 for keyword fallback
        try:
            self._conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts
                USING fts5(content, role, agent, content=memories, content_rowid=id)
            """)
        except Exception:
            pass  # FTS5 may already exist or not supported
        self._conn.commit()

    def store(self, role: str, content: str, agent: str = None, tags: List[str] = None):
        """Store a message with its embedding."""
        embedding = _encode(content)
        self._conn.execute("""
            INSERT INTO memories (timestamp, epoch, role, content, agent, embedding, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            time.strftime("%Y-%m-%dT%H:%M:%S"),
            time.time(),
            role,
            content[:2000],  # Cap at 2000 chars
            agent,
            embedding,
            json.dumps(tags) if tags else None,
        ))
        # Update FTS index
        row_id = self._conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        try:
            self._conn.execute(
                "INSERT INTO memories_fts(rowid, content, role, agent) VALUES (?, ?, ?, ?)",
                (row_id, content[:2000], role, agent or "")
            )
        except Exception:
            pass
        self._conn.commit()

    def search(self, query: str, limit: int = 5, min_score: float = 0.3) -> List[dict]:
        """Search memories semantically or by keyword."""
        if _use_embeddings:
            return self._vector_search(query, limit, min_score)
        else:
            return self._fts_search(query, limit)

    def _vector_search(self, query: str, limit: int, min_score: float) -> List[dict]:
        """Semantic search using cosine similarity."""
        query_vec = _model.encode(query, normalize_embeddings=True).tolist()

        # Get all memories with embeddings (bounded to last 1000)
        rows = self._conn.execute("""
            SELECT id, timestamp, role, content, agent, embedding
            FROM memories WHERE embedding IS NOT NULL
            ORDER BY epoch DESC LIMIT 1000
        """).fetchall()

        scored = []
        for row in rows:
            mem_vec = _decode(row["embedding"])
            score = _cosine_similarity(query_vec, mem_vec)
            if score >= min_score:
                scored.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "role": row["role"],
                    "content": row["content"],
                    "agent": row["agent"],
                    "score": round(score, 4),
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def _fts_search(self, query: str, limit: int) -> List[dict]:
        """Fallback: FTS5 keyword search."""
        try:
            rows = self._conn.execute("""
                SELECT m.id, m.timestamp, m.role, m.content, m.agent,
                       rank as score
                FROM memories_fts fts
                JOIN memories m ON m.id = fts.rowid
                WHERE memories_fts MATCH ?
                ORDER BY rank LIMIT ?
            """, (query, limit)).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            # Simple LIKE fallback if FTS fails
            words = query.split()[:3]
            conditions = " AND ".join(f"content LIKE '%{w}%'" for w in words)
            rows = self._conn.execute(f"""
                SELECT id, timestamp, role, content, agent, 0.5 as score
                FROM memories WHERE {conditions}
                ORDER BY epoch DESC LIMIT ?
            """, (limit,)).fetchall()
            return [dict(r) for r in rows]

    def get_count(self) -> int:
        return self._conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]

    def get_recent(self, limit: int = 10) -> List[dict]:
        rows = self._conn.execute("""
            SELECT id, timestamp, role, content, agent
            FROM memories ORDER BY epoch DESC LIMIT ?
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]


if __name__ == "__main__":
    vmem = VectorMemory()
    # Self-test
    vmem.store("user", "We discussed Amsterdam-based construction company Bouwgroep Dijkstra about a 500K deal")
    vmem.store("assistant", "I analyzed their financials — revenue is €12M with 15% growth")
    vmem.store("user", "The marketing campaign for TechStart should focus on LinkedIn")
    vmem.store("assistant", "Created LinkedIn content calendar for Q3 2026")
    vmem.store("user", "Invoice #2024-0342 for Bouwgroep is overdue by 30 days")

    print(f"Stored {vmem.get_count()} memories\n")

    query = "that Dutch construction company"
    results = vmem.search(query, limit=3)
    print(f"Search: '{query}'")
    for r in results:
        print(f"  [{r['score']:.3f}] {r['content'][:80]}...")

    query2 = "LinkedIn marketing"
    results2 = vmem.search(query2, limit=2)
    print(f"\nSearch: '{query2}'")
    for r in results2:
        print(f"  [{r['score']:.3f}] {r['content'][:80]}...")

    print(f"\n✅ VectorMemory self-test passed ({'embedding' if _use_embeddings else 'FTS5 fallback'} mode)")
