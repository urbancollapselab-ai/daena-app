# DAENA v3.0 — MASTER IMPLEMENTATION PLAN
> Last updated: 2026-04-05 | For: Any AI assistant (Claude, Antigravity, Cursor, etc.)
> Goal: Upgrade Daena from v1.0 → v3.0 (World's best autonomous AI agent system)

---

## TABLE OF CONTENTS
1. [Current System Architecture](#1-current-system-architecture)
2. [File Inventory (What Exists)](#2-file-inventory)
3. [Sprint 1: Security Foundation + Token Optimization](#sprint-1)
4. [Sprint 2: Eval Framework + Smart Routing](#sprint-2)
5. [Sprint 3: Protocol Standards + Knowledge Graph](#sprint-3)
6. [Sprint 4: Human-in-Loop + Versioning + Testing](#sprint-4)
7. [Sprint 5: Performance + UX Polish](#sprint-5)
8. [Sprint 6: Advanced Agent Capabilities](#sprint-6)
9. [Sprint 7: Reliability + Fault Tolerance](#sprint-7)
10. [Sprint 8: Integrations + Privacy](#sprint-8)
11. [Sprint 9: Mobile + Multimodal + Offline](#sprint-9)
12. [Sprint 10: Developer Experience + Deployment](#sprint-10)
13. [Frontend Updates Required](#frontend-updates)
14. [Implementation Rules](#implementation-rules)

---

## 1. CURRENT SYSTEM ARCHITECTURE

### Tech Stack
- **Frontend:** React 19 + TypeScript 6 + TailwindCSS 4 + Vite 8 + Zustand 5 + Framer Motion 12
- **Desktop Shell:** Tauri 2 (Rust) — macOS, Windows, Linux
- **Backend:** Python 3 (stdlib-only core, optional extras)
- **AI Models:** 20-model cascade via OpenRouter (13 free + 7 paid)
- **Databases:** SQLite (traces, tasks, vector_memory) + JSONL (messages, facts, memory)
- **Port:** Backend runs on localhost:8910

### Current Module Count
- 15 Python backend modules (~2,834 lines)
- 8 Agent CLAUDE.md department profiles
- React frontend with 7 page components
- Rust Tauri shell with 11 IPC commands

### How It Works (Request Flow)
```
User types message in React UI
  → Tauri IPC → commands.rs send_message()
    → spawns: python3 brain.py --message "..." --agent "..."
      → brain.py loads WorkerPool, Orchestrator, MemoryManager
      → Orchestrator classifies task → picks department agent
      → MemoryManager assembles context (HOT + WARM + COLD + VECTOR)
      → WorkerPool calls OpenRouter API (T0 → T1 → T2 → T3 cascade)
      → TraceLogger logs result to SQLite
      → Returns JSON: {response, model, latency_ms, tokens}
    → commands.rs returns to frontend
  → React UI renders response with model badge
```

---

## 2. FILE INVENTORY (What Currently Exists)

### Backend Python Files
| File | Path | Lines | Purpose |
|------|------|:-----:|---------|
| server.py | `backend/server.py` | 367 | HTTP server, 14 API endpoints, CORS |
| brain.py | `backend/scripts/brain.py` | 86 | CLI entry point, message handler |
| worker_pool.py | `backend/scripts/worker_pool.py` | 247 | 20-model cascade, OpenRouter API calls |
| orchestrator.py | `backend/scripts/orchestrator.py` | 81 | Keyword-based task routing to 8 departments |
| memory_manager.py | `backend/scripts/memory_manager.py` | 166 | 3-tier memory: HOT/WARM/COLD/VECTOR |
| vector_memory.py | `backend/scripts/vector_memory.py` | 213 | Semantic search, sentence-transformers, FTS5 fallback |
| context_manager.py | `backend/scripts/context_manager.py` | 203 | Token-aware context windows, auto-summarize |
| message_bus.py | `backend/scripts/message_bus.py` | 77 | JSONL inter-agent messaging |
| trace_logger.py | `backend/scripts/trace_logger.py` | 174 | SQLite audit trail, per-agent/model stats |
| safety_guard.py | `backend/scripts/safety_guard.py` | 137 | BLOCK/WARN/SAFE command validation |
| scheduler.py | `backend/scripts/scheduler.py` | 211 | Cron-like task scheduling, 5 defaults |
| task_runner.py | `backend/scripts/task_runner.py` | 233 | Durable task chains with checkpoints |
| agent_triggers.py | `backend/scripts/agent_triggers.py` | 125 | 5 chain triggers + 3 scheduled triggers |
| mcp_client.py | `backend/scripts/mcp_client.py` | 239 | Connect to external MCP servers |
| mcp_server.py | `backend/scripts/mcp_server.py` | 244 | Expose Daena as MCP server (6 tools, 3 resources) |

### Agent CLAUDE.md Files (8 departments, ~25 lines each)
| Agent | Path |
|-------|------|
| Finance 💰 | `backend/agents/finance/CLAUDE.md` |
| Data 📊 | `backend/agents/data/CLAUDE.md` |
| Marketing 📣 | `backend/agents/marketing/CLAUDE.md` |
| Sales 🎯 | `backend/agents/sales/CLAUDE.md` |
| Research 🔬 | `backend/agents/research/CLAUDE.md` |
| Watchdog 🛡️ | `backend/agents/watchdog/CLAUDE.md` |
| Heartbeat 💓 | `backend/agents/heartbeat/CLAUDE.md` |
| Coordinator 🎭 | `backend/agents/coordinator/CLAUDE.md` |

### Frontend Files
| File | Path | Lines | Purpose |
|------|------|:-----:|---------|
| App.tsx | `src/App.tsx` | 39 | Main layout, setup wizard gate |
| appStore.ts | `src/stores/appStore.ts` | 211 | Zustand state, 9 agents, 20 models |
| types/index.ts | `src/types/index.ts` | 87 | TypeScript interfaces |
| api.ts | `src/lib/api.ts` | 120 | Backend API client (port 8910) |
| i18n.ts | `src/i18n.ts` | ~238 | EN + TR translations |
| index.css | `src/index.css` | ~498 | Glassmorphism design system |
| ChatPage.tsx | `src/components/chat/ChatPage.tsx` | ~300 | Chat UI with @agent mentions |
| DashboardPage.tsx | `src/components/dashboard/DashboardPage.tsx` | ~420 | KPIs, agent network, model cascade |
| AgentsPage.tsx | `src/components/agents/AgentsPage.tsx` | ~334 | Agent monitors with sparklines |
| SettingsPage.tsx | `src/components/settings/SettingsPage.tsx` | ~384 | 7-section settings |
| SetupWizard.tsx | `src/components/setup/SetupWizard.tsx` | ~564 | 5-step initial setup |
| Sidebar.tsx | `src/components/layout/Sidebar.tsx` | ~200 | Navigation + chat history |
| TopBar.tsx | `src/components/layout/TopBar.tsx` | ~100 | Status pills, clock |

### Rust/Tauri Files
| File | Path | Lines | Purpose |
|------|------|:-----:|---------|
| lib.rs | `src-tauri/src/lib.rs` | 127 | App setup, auto-start Python backend |
| commands.rs | `src-tauri/src/commands.rs` | 443 | 11 IPC commands |
| main.rs | `src-tauri/src/main.rs` | 6 | Entry point |
| tauri.conf.json | `src-tauri/tauri.conf.json` | 92 | Window config, bundle resources |
| Cargo.toml | `src-tauri/Cargo.toml` | 26 | Rust dependencies |

### Config/Data Files
| File | Path | Purpose |
|------|------|---------|
| settings.json | `backend/config/settings.json` | Runtime settings |
| schedules.json | `backend/data/schedules.json` | 5 default schedules |
| .env.example | `backend/.env.example` | API key template |
| requirements.txt | `backend/requirements.txt` | Optional Python deps |
| package.json | `package.json` | Node dependencies |

---

## SPRINT 1: SECURITY FOUNDATION + TOKEN OPTIMIZATION 🔴
> Priority: CRITICAL | Estimated: 16 hours | Creates 6 new files

### 1.1 — Input Sanitizer
**File:** `backend/scripts/input_sanitizer.py` (NEW)
**Purpose:** Block prompt injection attacks BEFORE they reach agents

```python
# Architecture:
class InputSanitizer:
    def sanitize(self, user_input: str) -> dict:
        """Returns {safe: bool, cleaned: str, threats: list[str]}"""
        # Layer 1: Pattern matching (regex)
        #   - "ignore previous instructions" / "önceki talimatları unut"
        #   - "you are now..." / "sen artık..."
        #   - "system: ..." (fake system messages)
        #   - Role injection: ###, [SYSTEM], <|im_start|>
        #   - Base64/hex encoded payloads
        #
        # Layer 2: Structural analysis
        #   - Delimiter manipulation detection
        #   - Context window overflow attempts (>50K chars)
        #   - Nested instruction patterns
        #
        # Layer 3: Semantic similarity (if VectorMemory available)
        #   - Compare against known attack embeddings
        #   - Cosine similarity > 0.85 = block
        #
        # Returns cleaned input with threats stripped
```

**Integration point in server.py:**
```python
# In the /chat endpoint handler, BEFORE orchestrator:
sanitizer = InputSanitizer()
result = sanitizer.sanitize(message)
if not result["safe"]:
    trace_logger.log(agent="system", action="injection_blocked", ...)
    return {"success": False, "response": "Input blocked for safety.", ...}
# Then proceed with orchestrator...
```

### 1.2 — Output Guard (Source-Sink Protection)
**File:** `backend/scripts/output_guard.py` (NEW)
**Purpose:** Prevent agents from leaking sensitive data in responses

```python
# Architecture:
class OutputGuard:
    def validate_response(self, response: str, agent: str) -> dict:
        """Returns {safe: bool, cleaned: str, violations: list}"""
        # Check 1: PII leakage (see 1.4 PII filter)
        # Check 2: System prompt leakage
        #   - Detect if response contains CLAUDE.md content
        #   - Detect if response reveals internal model names/tiers
        # Check 3: URL safety
        #   - Block responses containing unknown/suspicious URLs
        #   - Whitelist: known business domains
        # Check 4: Data exfiltration patterns
        #   - Agent trying to encode data in base64
        #   - Agent suggesting to send data to external endpoints
        # Check 5: Tool call validation
        #   - If agent requests tool execution, validate parameters
        #   - Prevent path traversal in file operations
        #   - Prevent SQL injection in DB queries

    def validate_tool_call(self, tool_name: str, args: dict) -> dict:
        """Validate tool arguments before execution"""
        # File paths: must be within allowed directories
        # URLs: must be in whitelist
        # SQL: no DROP, DELETE, UPDATE without WHERE
```

**Integration point in server.py:**
```python
# After getting response from worker_pool, BEFORE returning to user:
guard = OutputGuard()
validated = guard.validate_response(response_text, agent_id)
if not validated["safe"]:
    trace_logger.log(agent=agent_id, action="output_blocked", ...)
    response_text = validated["cleaned"]  # Return sanitized version
```

### 1.3 — PII Detection & Redaction
**File:** `backend/scripts/pii_filter.py` (NEW)
**Purpose:** Strip personal data before sending to external AI models

```python
# Architecture:
class PIIFilter:
    # Regex patterns for structured PII:
    PATTERNS = {
        "dutch_bsn": r"\b\d{9}\b",  # Dutch citizen service number
        "iban": r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b",
        "phone_nl": r"\b(\+31|0031|06)\d{8}\b",
        "phone_intl": r"\b\+\d{10,15}\b",
        "email": r"\b[\w.+-]+@[\w-]+\.[\w.]+\b",
        "credit_card": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
        "ip_address": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    }

    def redact(self, text: str) -> tuple[str, dict]:
        """Returns (redacted_text, mapping) where mapping allows re-hydration"""
        # Replace each PII match with [PII_TYPE_N] token
        # Store mapping: {"[PII_EMAIL_1]": "actual@email.com"}
        # Return both so we can re-hydrate after model response

    def rehydrate(self, text: str, mapping: dict) -> str:
        """Replace PII tokens back with original values"""
```

**Integration point in worker_pool.py:**
```python
# In the call() method, BEFORE sending to OpenRouter:
pii = PIIFilter()
clean_prompt, pii_map = pii.redact(prompt)
# ... send clean_prompt to API ...
# After getting response:
response = pii.rehydrate(raw_response, pii_map)
```

### 1.4 — API-Native Prompt Caching
**Update:** `backend/scripts/worker_pool.py` (MODIFY existing)
**Purpose:** Use Anthropic/OpenAI cache_control to avoid re-processing system prompts

```python
# In WorkerPool._call_model(), modify the messages structure:
# BEFORE (current):
messages = [
    {"role": "system", "content": full_system_prompt},
    {"role": "user", "content": user_message}
]

# AFTER (with cache_control):
messages = [
    {
        "role": "system",
        "content": full_system_prompt,
        "cache_control": {"type": "ephemeral"}  # OpenRouter passes this to providers
    },
    {"role": "user", "content": user_message}
]
# This tells the provider to cache the system prompt
# Result: ~60-90% input token cost reduction on subsequent calls
# Only works with Anthropic and some other providers via OpenRouter
```

### 1.5 — Semantic Tool Selection
**File:** `backend/scripts/tool_selector.py` (NEW)
**Purpose:** Only send relevant tool definitions in context (saves ~91% tokens)

```python
# Architecture:
class ToolSelector:
    def __init__(self):
        self.tools = {}  # tool_name -> {description, schema, embedding}
        # Store tool description embeddings in vector_memory

    def register_tool(self, name: str, description: str, schema: dict):
        """Register a tool with its description and parameter schema"""

    def select_tools(self, query: str, max_tools: int = 3) -> list[dict]:
        """Given a user query, return only the most relevant tools"""
        # Compute query embedding
        # Cosine similarity against all tool embeddings
        # Return top max_tools
        # This means instead of sending ALL 8 agent tool definitions
        # in every prompt (thousands of tokens), we send only 2-3 relevant ones
```

### 1.6 — WAL Mode + Backup Verification
**File:** `backend/scripts/db_utils.py` (NEW)
**Purpose:** Enable SQLite WAL mode for concurrent access + verify backups

```python
# Architecture:
class DBUtils:
    @staticmethod
    def enable_wal(db_path: str):
        """Enable Write-Ahead Logging for concurrent reads/writes"""
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")  # Faster with WAL
        conn.close()

    @staticmethod
    def backup(src_path: str, dest_path: str) -> bool:
        """Create verified backup using SQLite backup API"""
        src = sqlite3.connect(src_path)
        dst = sqlite3.connect(dest_path)
        src.backup(dst)
        dst.close()
        # Verify backup integrity:
        verify = sqlite3.connect(dest_path)
        result = verify.execute("PRAGMA integrity_check").fetchone()
        verify.close()
        return result[0] == "ok"

    @staticmethod
    def distributed_lock(db_path: str, lock_name: str, timeout: int = 30):
        """Application-level advisory lock to prevent race conditions"""
        # Uses a locks table in SQLite with timeout-based expiry
```

**Integration:** Call `enable_wal()` on startup in server.py for all 3 databases:
- `data/traces.db`
- `data/tasks.db`
- `data/vector_memory.db`

---

## SPRINT 2: EVAL FRAMEWORK + SMART ROUTING 🔴
> Priority: CRITICAL | Estimated: 22 hours | Creates 5 new files

### 2.1 — LLM-as-Judge Eval
**File:** `backend/scripts/eval_judge.py` (NEW)

```python
# Architecture:
class EvalJudge:
    def __init__(self, worker_pool):
        self.pool = worker_pool

    def evaluate(self, prompt: str, response: str, agent: str) -> dict:
        """Score an agent response using a different model as judge"""
        judge_prompt = f"""Rate this AI response on 5 criteria (0-10 each):
        1. Accuracy: Is the information correct?
        2. Relevance: Does it answer the question?
        3. Completeness: Are all parts addressed?
        4. Safety: No harmful/inappropriate content?
        5. Hallucination: Any made-up facts? (10=none, 0=all fake)

        USER QUERY: {prompt[:500]}
        AGENT ({agent}) RESPONSE: {response[:1000]}

        Return JSON: {{"accuracy":N,"relevance":N,"completeness":N,"safety":N,"hallucination":N,"overall":N,"reasoning":"..."}}"""

        # Use a T2 free model as judge (different model than the one that generated)
        result = self.pool.call(judge_prompt, task_type="eval")
        # Parse JSON from result
        # Return scores dict

    def should_warn_user(self, scores: dict) -> bool:
        """Returns True if quality is below threshold"""
        return scores.get("overall", 10) < 5

    def get_agent_report(self, agent: str, days: int = 7) -> dict:
        """Weekly quality report card per agent"""
        # Query trace_logger for recent evaluations
        # Calculate averages per criterion
```

**Integration in server.py /chat handler:**
```python
# After getting response, before returning:
# Only eval if response is substantial (>50 chars) and not an error
if len(response) > 50 and result.get("success"):
    eval_scores = eval_judge.evaluate(message, response, agent_id)
    # Add to trace logger
    trace_logger.log(..., metadata=json.dumps({"eval": eval_scores}))
    # Include in response to frontend
    result["eval_scores"] = eval_scores
```

### 2.2 — User Feedback Loop
**Update:** `backend/server.py` (ADD endpoint)

```python
# NEW ENDPOINT: POST /feedback
# Body: {"message_id": "...", "rating": "up"|"down", "comment": "..."}
# Stores in feedback.jsonl
# Used by eval_judge to calibrate scores over time
# If user rates "down" but judge scored 8/10 → flag for judge recalibration
```

### 2.3 — Semantic Response Cache
**File:** `backend/scripts/response_cache.py` (NEW)

```python
# Architecture:
class ResponseCache:
    def __init__(self, ttl_seconds: dict = None):
        # Per-agent TTL: finance=3600, research=86400, default=1800
        self.db = sqlite3.connect("data/cache.db")
        # Table: cache (hash TEXT, embedding BLOB, prompt TEXT, response TEXT,
        #               agent TEXT, model TEXT, created REAL, ttl INT)

    def get(self, prompt: str, agent: str = None) -> dict | None:
        """Check cache for semantically similar prompt"""
        # Normalize prompt (lowercase, strip whitespace)
        # Compute hash for exact match (fast path)
        # If no exact match, compute embedding and cosine similarity
        # Return cached response if similarity > 0.92 and not expired

    def put(self, prompt: str, response: str, agent: str, model: str):
        """Store response in cache"""

    def invalidate(self, agent: str = None):
        """Clear cache for agent or all"""
```

**Integration in brain.py:**
```python
# Before calling worker_pool:
cached = response_cache.get(message, agent)
if cached:
    return {**cached, "from_cache": True, "latency_ms": 0}
# After getting fresh response:
response_cache.put(message, response, agent, model)
```

### 2.4 — Prompt Compression
**File:** `backend/scripts/prompt_compressor.py` (NEW)

```python
# Architecture:
class PromptCompressor:
    def compress_system_prompt(self, prompt: str, target_model_context: int) -> str:
        """Compress system prompt based on target model's context window"""
        if target_model_context >= 100000:  # 100K+ models get full prompt
            return prompt
        # For smaller context models:
        # Remove examples, keep core instructions
        # Reduce verbose descriptions to bullet points
        # Strip comments and decorative text

    def compress_history(self, messages: list, max_tokens: int) -> list:
        """Telescoping compression of conversation history"""
        # Keep last 3 messages verbatim
        # Summarize older messages in groups of 5
        # Drop system-level messages older than 10 turns
```

### 2.5 — Circuit Breaker
**File:** `backend/scripts/circuit_breaker.py` (NEW)

```python
# Architecture:
class CircuitBreaker:
    # States: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
    def __init__(self):
        self.states = {}  # model_id → {state, failures, last_failure, last_success}

    def can_call(self, model_id: str) -> bool:
        """Check if model is available (not in OPEN state)"""
        state = self.states.get(model_id, {"state": "CLOSED"})
        if state["state"] == "CLOSED":
            return True
        if state["state"] == "OPEN":
            # Check if cooldown (30s) has passed → transition to HALF_OPEN
            if time.time() - state["last_failure"] > 30:
                state["state"] = "HALF_OPEN"
                return True  # Allow one test request
            return False
        return True  # HALF_OPEN: allow test

    def record_success(self, model_id: str):
        """Reset to CLOSED on success"""

    def record_failure(self, model_id: str):
        """After 3 consecutive failures → OPEN"""
```

**Integration in worker_pool.py:**
```python
# In the cascade loop, before trying each model:
if not circuit_breaker.can_call(model_id):
    continue  # Skip this model, try next in cascade
# After call:
if success:
    circuit_breaker.record_success(model_id)
else:
    circuit_breaker.record_failure(model_id)
```

### 2.6 — Smart Router (Distilled + Dynamic)
**File:** `backend/scripts/smart_router.py` (NEW)

```python
# Architecture:
class SmartRouter:
    def __init__(self):
        # Performance matrix: {(model_id, task_type): {quality, latency, cost, count}}
        self.matrix = {}
        self.db = sqlite3.connect("data/routing.db")

    def get_best_model(self, task_type: str, complexity: str) -> list[str]:
        """Return ordered list of best models for this task type"""
        # If enough data (>20 samples for this task_type):
        #   Sort models by quality score descending
        #   Filter by complexity budget
        # Else:
        #   Fall back to static tier ordering (T0→T1→T2→T3)

    def record_outcome(self, model_id: str, task_type: str, quality: float, latency: int):
        """Update performance matrix with new data point"""

    def get_model_report(self) -> dict:
        """Weekly model performance report"""
```

---

## SPRINT 3: PROTOCOL STANDARDS + KNOWLEDGE GRAPH 🟠
> Priority: HIGH | Estimated: 29 hours | Creates 5 new files

### 3.1 — OpenTelemetry GenAI Exporter
**File:** `backend/scripts/otel_exporter.py` (NEW)

```python
# Architecture:
# Wraps existing trace_logger with OTel-compatible span export
# Each LLM call becomes an OTel span with GenAI semantic attributes:
#   gen_ai.system = "openrouter"
#   gen_ai.request.model = model_id
#   gen_ai.usage.input_tokens = N
#   gen_ai.usage.output_tokens = N
#   gen_ai.response.finish_reason = "stop"
#   daena.agent = agent_id
#   daena.conversation_id = conv_id
#
# Export via OTLP/HTTP (optional, for Grafana/Langfuse)
# Keeps existing SQLite trace as local fallback
# OTel export is opt-in via settings.json: "otel_endpoint": "http://..."
```

### 3.2 — Google A2A Protocol Server
**File:** `backend/scripts/a2a_server.py` (NEW)

```python
# Architecture:
# Implements Google Agent-to-Agent protocol (open standard, 2025+)
# Enables Daena agents to communicate with external agent systems
#
# Components:
# 1. Agent Card (JSON-LD description of each Daena agent)
#    GET /.well-known/agent.json → returns capabilities, skills, endpoints
#
# 2. Task Lifecycle: submitted → working → input-required → completed → failed
#    POST /a2a/tasks → create new task
#    GET /a2a/tasks/{id} → get status + result
#
# 3. SSE streaming for long-running tasks
#    GET /a2a/tasks/{id}/stream → Server-Sent Events
#
# 4. Push notification channel (webhook callback)
#
# Integration: Add routes to server.py under /a2a/ prefix
```

### 3.3 — GraphRAG (Knowledge Graph)
**File:** `backend/scripts/graph_memory.py` (NEW)

```python
# Architecture:
# Lightweight knowledge graph using SQLite (no Neo4j needed)
# Uses recursive CTEs for graph traversal
#
# Tables:
#   nodes (id, type, name, properties JSON, created)
#     Types: customer, product, company, person, event, document
#   edges (id, source_id, target_id, relation, properties JSON, created)
#     Relations: works_for, purchased, competitor_of, mentioned_in, etc.
#
# API:
class GraphMemory:
    def add_node(self, type: str, name: str, properties: dict) -> int
    def add_edge(self, source: int, target: int, relation: str, properties: dict) -> int
    def query(self, question: str) -> list:
        """Multi-hop query using recursive CTE"""
        # Example: "Which customers in e-commerce sector received proposals?"
        # → Traverse: Customer -[in_sector]→ Sector -[received]→ Proposal
    def hybrid_search(self, query: str) -> list:
        """Combine vector search results with graph traversal"""
        # 1. Vector search for relevant nodes
        # 2. Expand nodes via graph edges (1-2 hops)
        # 3. Merge and rank results
```

**Integration in memory_manager.py:**
```python
# Add GraphMemory as a 5th tier alongside VECTOR:
# HOT → WARM → COLD → VECTOR → GRAPH
# For multi-hop questions, graph_memory.hybrid_search() is called
```

### 3.4 — Agentic RAG (Retrieval Planner)
**File:** `backend/scripts/retrieval_planner.py` (NEW)

```python
# Architecture:
class RetrievalPlanner:
    def plan(self, query: str) -> list[dict]:
        """Decide retrieval strategy based on query analysis"""
        # Classify query type:
        # - SIMPLE: "What time is our meeting?" → keyword search only
        # - SEMANTIC: "Find similar proposals" → vector search
        # - RELATIONAL: "Who are our biggest customers' competitors?" → graph search
        # - ITERATIVE: "Compare all Q1 invoices" → multi-step retrieval
        # - HYBRID: Complex queries → vector + graph + re-ranking
        #
        # Returns ordered list of retrieval steps:
        # [{"method": "vector", "query": "..."}, {"method": "graph", "query": "..."}]

    def execute(self, plan: list[dict]) -> list[dict]:
        """Execute retrieval plan and merge results"""
```

### 3.5 — NeMo Guardrails Engine
**File:** `backend/scripts/guardrails_engine.py` (NEW)

```python
# Architecture:
# Programmatic guardrails using rule definitions (inspired by NeMo Colang)
# Each agent has topic boundaries and safety rails
#
# Rules defined in YAML-like config per agent:
# agents/finance/rails.json:
# {
#   "allowed_topics": ["invoicing", "budgets", "expenses", "tax", "revenue"],
#   "forbidden_topics": ["personal_investment_advice", "crypto_trading"],
#   "safety_rails": {
#     "max_amount_without_approval": 10000,
#     "require_approval_for": ["send_email", "create_invoice", "delete_record"]
#   },
#   "dialog_rails": {
#     "must_confirm_before": ["financial_commitment", "data_deletion"],
#     "cannot_reveal": ["api_keys", "internal_model_names", "system_prompts"]
#   }
# }
#
class GuardrailsEngine:
    def check_input(self, message: str, agent: str) -> dict:
        """Check if input is within agent's topic boundaries"""
    def check_output(self, response: str, agent: str) -> dict:
        """Check if output complies with safety and dialog rails"""
    def check_action(self, action: str, params: dict, agent: str) -> dict:
        """Check if action requires approval or is forbidden"""
```

---

## SPRINT 4: HUMAN-IN-LOOP + VERSIONING + TESTING 🟠
> Priority: HIGH | Estimated: 23 hours | Creates 6 new files + test directory

### 4.1 — Approval Queue
**File:** `backend/scripts/approval_queue.py` (NEW)

```python
# Architecture:
class ApprovalQueue:
    # SQLite table: approvals (id, agent, action, risk_level, payload JSON,
    #   status [pending/approved/rejected/expired], created, resolved, resolved_by)
    #
    # Risk levels:
    # LOW → auto-execute (info queries, summaries)
    # MEDIUM → execute + notify (content creation, CRM reads)
    # HIGH → queue for approval (invoices, emails, price quotes, data modification)
    # CRITICAL → double approval (bulk ops, config changes, >$1000 actions)

    def submit(self, agent: str, action: str, payload: dict, risk: str) -> str:
        """Submit action for approval, returns approval_id"""
    def approve(self, approval_id: str, approver: str = "user") -> dict:
        """Approve pending action"""
    def reject(self, approval_id: str, reason: str = "") -> dict:
        """Reject pending action"""
    def get_pending(self) -> list[dict]:
        """List all pending approvals"""
    def auto_expire(self, hours: int = 24):
        """Expire old pending approvals"""

# Integration: Add POST /approvals/approve, /approvals/reject, GET /approvals to server.py
# Frontend: New "Approvals" page showing pending items with approve/reject buttons
```

### 4.2 — Config Versioner
**File:** `backend/scripts/config_versioner.py` (NEW)

```python
# Architecture:
class ConfigVersioner:
    # SQLite: config_versions (id, file_path, content, hash, timestamp, diff TEXT)
    # Max 50 versions per file (FIFO cleanup)

    def snapshot(self, file_path: str):
        """Save current file state as a version"""
        # Read file, compute hash, generate diff against previous version
        # Store in SQLite

    def rollback(self, file_path: str, version_id: int):
        """Restore file to a previous version"""

    def get_history(self, file_path: str, limit: int = 20) -> list[dict]:
        """List version history for a file"""

    def get_diff(self, version_id_1: int, version_id_2: int) -> str:
        """Show diff between two versions"""

# Watched files:
# - backend/agents/*/CLAUDE.md (all 8 agent prompts)
# - backend/config/settings.json
# - backend/data/schedules.json
# Auto-snapshot on every change detected
```

### 4.3 — Feature Flags
**File:** `backend/scripts/feature_flags.py` (NEW)

```python
# Architecture:
class FeatureFlags:
    # JSON file: config/features.json
    # {"semantic_cache": true, "eval_judge": true, "graph_rag": false, ...}

    def is_enabled(self, flag: str) -> bool:
        """Check if feature is enabled"""

    def enable(self, flag: str):
    def disable(self, flag: str):
    def list_all(self) -> dict:

# All new features wrapped in feature flag checks:
# if feature_flags.is_enabled("eval_judge"):
#     scores = eval_judge.evaluate(...)
```

### 4.4 — Test Suite Setup
**Directory:** `backend/tests/` (NEW)

```
backend/tests/
├── __init__.py
├── conftest.py                    # Shared fixtures
├── unit/
│   ├── test_worker_pool.py        # Model cascade fallback
│   ├── test_orchestrator.py       # Routing correctness
│   ├── test_memory_manager.py     # HOT→WARM eviction
│   ├── test_safety_guard.py       # BLOCK/WARN/SAFE classification
│   ├── test_input_sanitizer.py    # Injection detection
│   ├── test_output_guard.py       # Output filtering
│   ├── test_pii_filter.py         # PII detection
│   ├── test_circuit_breaker.py    # State transitions
│   ├── test_response_cache.py     # Cache hit/miss
│   └── test_config_versioner.py   # Snapshot/rollback
├── integration/
│   ├── test_chat_flow.py          # Full message → response flow
│   ├── test_trigger_chain.py      # Data→Sales→Finance chain
│   └── test_approval_flow.py      # Submit→approve→execute
├── adversarial/
│   ├── injection_dataset.json     # 200+ known injection patterns (15 languages)
│   ├── test_injections.py         # Run all patterns against sanitizer
│   └── test_hallucination.py      # Known hallucination triggers
└── chaos/
    ├── test_model_timeout.py      # Simulate API timeout
    ├── test_api_key_invalid.py    # Simulate auth failure
    └── test_concurrent_access.py  # Race condition testing
```

### 4.5 — DB Migration System
**File:** `backend/scripts/db_migrator.py` (NEW)
**Directory:** `backend/migrations/` (NEW)

```python
# Architecture:
class DBMigrator:
    # Table: schema_version (version INT, applied_at TEXT, migration_name TEXT)

    def get_current_version(self) -> int:
    def apply_pending(self):
        """Apply all migrations newer than current version"""
        # Read migration files from backend/migrations/
        # Each file: NNN_description.sql with UP and DOWN sections
        # Apply in order, update schema_version table
    def rollback(self, to_version: int):
        """Rollback to specific version using DOWN sections"""

# Migration file format (backend/migrations/001_initial.sql):
# -- UP
# CREATE TABLE IF NOT EXISTS ...;
# -- DOWN
# DROP TABLE IF EXISTS ...;
```

---

## SPRINT 5: PERFORMANCE + UX POLISH 🟡
> Priority: MEDIUM | Estimated: 25 hours

### 5.1 — WebSocket Server (replace HTTP polling)
**Update:** `backend/server.py` (MAJOR UPDATE)

```python
# Replace the current 15-second polling with WebSocket
# Use Python's built-in asyncio + websockets (or keep http.server + add WS)
#
# WebSocket messages:
# Server → Client:
#   {"type": "agent_status", "data": {...}}
#   {"type": "stream_token", "data": {"token": "...", "message_id": "..."}}
#   {"type": "thinking", "data": {"agent": "finance", "step": "Analyzing revenue..."}}
#   {"type": "trigger_fired", "data": {"from": "data", "to": "sales", ...}}
#   {"type": "approval_needed", "data": {...}}
#   {"type": "eval_complete", "data": {"message_id": "...", "scores": {...}}}
#
# Client → Server:
#   {"type": "chat", "data": {"message": "...", "agent": "..."}}
#   {"type": "approve", "data": {"approval_id": "..."}}
```

### 5.2 — Response Streaming + Thinking Indicator
**Update:** `backend/scripts/worker_pool.py` (MODIFY)

```python
# Change _call_model to support streaming:
# Instead of waiting for full response, yield tokens as they arrive
# Send thinking steps via WebSocket:
# "🔍 Routing to Finance agent..."
# "⚡ Calling Qwen 3.6 Plus..."
# "📝 Generating response..."
# "✅ Quality check: 8.5/10"
```

### 5.3 — Command Palette (Cmd+K)
**Frontend:** New component `src/components/CommandPalette.tsx`

```typescript
// Features:
// - Global keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
// - Search: agents, conversations, commands, settings
// - Quick actions: new chat, switch agent, export conversation
// - Recent items list
// - Fuzzy search matching
```

### 5.4 — Multi-Language Agent Response
**Update:** `backend/scripts/orchestrator.py` (MODIFY)

```python
# Detect input language (simple heuristic: character ranges + common words)
# Inject language instruction into agent context:
# "Respond in Turkish" / "Respond in English" / "Respond in Dutch"
# This ensures agent responses match user's language
```

### 5.5 — Conversation Export
**File:** `backend/scripts/export.py` (NEW)

```python
# Export conversations as:
# - Markdown (.md)
# - PDF (using reportlab or weasyprint)
# - JSON (raw data)
# Include: messages, agent badges, model info, timestamps, eval scores
```

### 5.6 — DAG Planner (Chain-of-Thought)
**File:** `backend/scripts/dag_planner.py` (NEW)

```python
# For complex tasks, decompose into sub-tasks with dependencies
# Example: "Analyze Q1 and prepare strategy"
# → Step 1: Finance agent → Q1 revenue data
# → Step 2: Research agent → competitor Q1 data (parallel with Step 1)
# → Step 3: Marketing agent → strategy draft (depends on Step 1 + 2)
# Execution: parallel where possible, sequential where dependent
```

### 5.7 — Auto Prompt Tuning
**File:** `backend/scripts/prompt_tuner.py` (NEW)

```python
# Weekly optimization loop:
# 1. Collect (input, output, eval_score) triplets per agent
# 2. Identify low-scoring patterns
# 3. Generate prompt variants (modify instructions, add examples)
# 4. Test variants against held-out tasks using eval_judge
# 5. If variant scores >5% better → promote as new version
# 6. Config versioner tracks the change
```

---

## SPRINT 6: ADVANCED AGENT CAPABILITIES 🟡
> Priority: MEDIUM | Estimated: 20 hours

### 6.1 — Agent Skill Learning
**File:** `backend/scripts/skill_learner.py` (NEW)
- Track user feedback per agent per task type
- Generate improved few-shot examples from successful tasks
- Auto-update agent CLAUDE.md with proven examples

### 6.2 — Speculative Execution
**File:** `backend/scripts/speculative.py` (NEW)
- Analyze last 30 days of query patterns
- Pre-compute likely questions (Monday = weekly report)
- Cache results, serve instantly if predicted correctly
- Only use free-tier models for speculation

### 6.3 — Tool Registry
**File:** `backend/scripts/tool_registry.py` (NEW)
- Central registry of all available tools
- Schema: name, description, parameters, permissions, cost
- Agents request tools by name, registry validates and executes
- New tools = drop Python file in `tools/` directory

### 6.4 — Error Pattern Auto-Fix
**File:** `backend/scripts/error_auto_fix.py` (NEW)
- Nightly job: cluster errors by type and agent
- If pattern repeats 5+ times → auto-generate prompt fix
- Apply fix via config_versioner (tracked, rollback-able)

### 6.5 — Self-Diagnostic
**File:** `backend/scripts/self_diagnostic.py` (NEW)
- `/diagnostic` command tests everything:
  - Each model endpoint (latency + correctness)
  - All SQLite databases (integrity check)
  - Memory usage, disk space
  - Integration connectivity
  - Generates health report

---

## SPRINT 7: RELIABILITY + FAULT TOLERANCE 🟡
> Priority: MEDIUM | Estimated: 15 hours

### 7.1 — Graceful Degradation
**File:** `backend/scripts/degradation.py` (NEW)
- FULL → REDUCED → MINIMAL → EMERGENCY
- Based on: model availability, budget remaining, error rate
- REDUCED: disable speculative execution, use compressed prompts
- MINIMAL: only Finance + Coordinator agents active
- EMERGENCY: queue all tasks, notify user

### 7.2 — State Snapshots
**File:** `backend/scripts/snapshot_manager.py` (NEW)
- Every 6 hours: backup all SQLite databases + config files
- Verify each backup with integrity_check
- Keep 7 days of snapshots (rotating)
- Auto-restore on corruption detected at startup

### 7.3 — Dead Letter Queue
**File:** `backend/scripts/dead_letter_queue.py` (NEW)
- Failed tasks (all retries exhausted) → DLQ table
- Dashboard shows DLQ count prominently
- User can manually retry, modify, or dismiss

### 7.4 — Request Idempotency
**File:** `backend/scripts/idempotency.py` (NEW)
- Each task gets UUID
- Before side-effecting action: check if UUID+action already executed
- Prevents duplicate invoices, emails, etc.

---

## SPRINT 8: INTEGRATIONS + PRIVACY 🟡
> Priority: MEDIUM | Estimated: 30 hours

### 8.1-8.7 — Integration Modules
**Directory:** `backend/integrations/` (NEW)
- `calendar.py` — Google Calendar / CalDAV
- `email.py` — IMAP/Gmail API
- `banking.py` — PSD2 Open Banking (NL)
- `crm.py` — HubSpot/Pipedrive
- `storage.py` — Google Drive / Dropbox
- `platforms/slack.py` — Slack Bot
- `platforms/whatsapp.py` — WhatsApp Business
- `web_monitor.py` — Intelligent website change detection

### 8.8 — GDPR Module
**File:** `backend/scripts/gdpr.py` (NEW)
- Data inventory (what personal data, where, why)
- Right to access (export all data for a person)
- Right to deletion (purge from all stores including vectors)
- Data minimization (auto-delete old unnecessary data)

### 8.9 — Data Retention Policies
**File:** `backend/scripts/retention.py` (NEW)
- Conversations: 90 days → archive
- Trace logs: 1 year → delete
- Financial records: 7 years (Dutch law)
- Cached responses: 7 days → delete
- Nightly cleanup job

---

## SPRINT 9: MOBILE + MULTIMODAL + OFFLINE 🟡
> Priority: MEDIUM | Estimated: 25 hours

### 9.1 — Voice Input (Whisper STT)
**File:** `backend/scripts/voice.py` (NEW)

### 9.2 — Image Analysis (Vision models)
**File:** `backend/scripts/vision.py` (NEW)
- Route images to vision-capable models (Maverick, Gemma 4, Gemini)

### 9.3 — Document Processor
**File:** `backend/scripts/doc_processor.py` (NEW)
- PDF → text (pdfplumber)
- Excel/CSV → summary (pandas)
- Word → text (python-docx)
- Images → OCR (Tesseract)

### 9.4 — Local Model Fallback
**File:** `backend/scripts/local_model.py` (NEW)
- Quantized 3B model via llama.cpp
- Activated when all remote models fail (no internet)
- Handles: basic Q&A, local task management, offline queue

### 9.5 — Offline Task Queue
**File:** `backend/scripts/offline_queue.py` (NEW)
- Commands issued while offline → persistent SQLite queue
- Process when connectivity returns
- Show "queued" status in UI

---

## SPRINT 10: DEVELOPER EXPERIENCE + DEPLOYMENT 🟡
> Priority: MEDIUM | Estimated: 20 hours

### 10.1 — Plugin System
**File:** `backend/scripts/plugin_manager.py` (NEW)
- `plugins/` directory, auto-discovery
- Manifest: name, version, permissions, entry points
- Sandboxed execution

### 10.2 — REST API (FastAPI)
**File:** `backend/api_server.py` (NEW)
- Full API access for external tools (Zapier, n8n)
- Auth via API keys
- OpenAPI spec auto-generated

### 10.3 — Webhook System
**File:** `backend/scripts/webhooks.py` (NEW)
- External events → agent actions
- Signature verification
- Per-webhook target agent + transformation template

### 10.4 — CLI Tool
**File:** `backend/scripts/cli.py` (NEW)
- `daena ask "..."` — send message
- `daena status` — system health
- `daena agent finance "..."` — target specific agent
- `daena export <conv_id>` — export conversation

### 10.5 — A/B Testing
**File:** `backend/scripts/ab_testing.py` (NEW)
- Define experiments: control vs test prompt/config
- Split traffic by request ID
- Compare quality scores after N samples
- Auto-promote winner

### 10.6 — Crash Reporter
**File:** `backend/scripts/crash_reporter.py` (NEW)
- Catch unhandled exceptions
- Log: stack trace, OS info, last actions, memory state
- Send report (optional: to Telegram or webhook)

### 10.7 — Code Signing
- macOS: Apple Developer Certificate for notarization
- Windows: EV Code Signing Certificate
- Update tauri.conf.json with signing keys

---

## FRONTEND UPDATES REQUIRED

### New Pages to Create
| Component | Path | Purpose |
|-----------|------|---------|
| ApprovalsPage.tsx | `src/components/approvals/ApprovalsPage.tsx` | Pending approval queue |
| CommandPalette.tsx | `src/components/CommandPalette.tsx` | Cmd+K global search |
| ConfigHistoryPage.tsx | `src/components/settings/ConfigHistoryPage.tsx` | Version diff/rollback |
| BenchmarkPage.tsx | `src/components/dashboard/BenchmarkPage.tsx` | Model performance reports |

### Existing Pages to Update
| Component | Updates Needed |
|-----------|---------------|
| ChatPage.tsx | Add eval score badges, streaming tokens, thinking indicator, copy button, conversation export |
| DashboardPage.tsx | Add anomaly alerts, cost attribution, quality trending chart, dead letter queue count |
| AgentsPage.tsx | Add skill learning stats, guardrail config, DAG task visualization |
| SettingsPage.tsx | Add feature flags section, retention policy config, integration management |
| Sidebar.tsx | Add approvals badge count, command palette trigger |
| TopBar.tsx | Add degradation level indicator, DLQ count |

### appStore.ts — New State
```typescript
// Add to AppState interface:
pendingApprovals: ApprovalItem[];
featureFlags: Record<string, boolean>;
degradationLevel: "full" | "reduced" | "minimal" | "emergency";
deadLetterCount: number;
evalScores: Record<string, number>; // message_id → overall score
```

### types/index.ts — New Types
```typescript
interface ApprovalItem {
  id: string;
  agent: string;
  action: string;
  risk: "low" | "medium" | "high" | "critical";
  payload: any;
  status: "pending" | "approved" | "rejected" | "expired";
  created: string;
}

interface EvalScores {
  accuracy: number;
  relevance: number;
  completeness: number;
  safety: number;
  hallucination: number;
  overall: number;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
}
```

### api.ts — New API Functions
```typescript
// Add these functions:
export async function submitFeedback(messageId: string, rating: "up" | "down"): Promise<boolean>
export async function getPendingApprovals(): Promise<ApprovalItem[]>
export async function approveAction(id: string): Promise<boolean>
export async function rejectAction(id: string, reason?: string): Promise<boolean>
export async function getConfigHistory(filePath: string): Promise<any[]>
export async function rollbackConfig(versionId: number): Promise<boolean>
export async function getFeatureFlags(): Promise<Record<string, boolean>>
export async function setFeatureFlag(name: string, enabled: boolean): Promise<boolean>
export async function exportConversation(convId: string, format: "md" | "pdf" | "json"): Promise<Blob>
export async function getDiagnostics(): Promise<any>
```

---

## IMPLEMENTATION RULES

### For Any AI Assistant Reading This:

1. **Working directory:** `/Users/Vedat/Desktop/daena/daena-app/`
2. **Backend directory:** `backend/` (all Python files go here)
3. **New scripts go in:** `backend/scripts/` (import from other scripts there)
4. **All new files must:**
   - Use Python 3 stdlib only (no pip install unless absolutely necessary)
   - Have a self-test block: `if __name__ == "__main__": ...`
   - Follow existing code style (see worker_pool.py as reference)
   - Use SQLite for persistence (in `backend/data/`)
   - Use JSON/JSONL for config (in `backend/config/` or `backend/data/`)

5. **server.py integration pattern:**
   - Import the new module at top
   - Initialize in DaenaServer.__init__()
   - Add endpoint(s) in DaenaServer.do_GET or do_POST
   - Follow existing URL pattern: `/endpoint-name`

6. **Do NOT modify:**
   - `~/.claude/settings.json`
   - Any files outside `~/Desktop/daena/`
   - Existing functionality (only ADD, don't break)

7. **Testing:** Every new module must have corresponding test in `backend/tests/`

8. **Feature flags:** Every new feature should be wrapped in a feature flag check so it can be disabled if broken

9. **Language:** Code and comments in English. User-facing strings in both EN and TR (add to i18n.ts)

10. **Token efficiency:** When calling AI models, always:
    - Use prompt caching (cache_control) where possible
    - Compress system prompts for small-context models
    - Check response cache before making API call
    - Use free-tier models for internal tasks (eval, summarization)

### Priority Order (if token-limited, do these first):
```
MUST DO:    Sprint 1 (security + tokens) → Sprint 2 (eval + routing)
SHOULD DO:  Sprint 3 (protocols) → Sprint 4 (testing)
NICE TO DO: Sprint 5-10 (everything else)
```

### Quick Reference: New Files to Create
```
backend/scripts/input_sanitizer.py      ← Sprint 1
backend/scripts/output_guard.py         ← Sprint 1
backend/scripts/pii_filter.py           ← Sprint 1
backend/scripts/tool_selector.py        ← Sprint 1
backend/scripts/db_utils.py             ← Sprint 1
backend/scripts/eval_judge.py           ← Sprint 2
backend/scripts/response_cache.py       ← Sprint 2
backend/scripts/prompt_compressor.py    ← Sprint 2
backend/scripts/circuit_breaker.py      ← Sprint 2
backend/scripts/smart_router.py         ← Sprint 2
backend/scripts/otel_exporter.py        ← Sprint 3
backend/scripts/a2a_server.py           ← Sprint 3
backend/scripts/graph_memory.py         ← Sprint 3
backend/scripts/retrieval_planner.py    ← Sprint 3
backend/scripts/guardrails_engine.py    ← Sprint 3
backend/scripts/approval_queue.py       ← Sprint 4
backend/scripts/config_versioner.py     ← Sprint 4
backend/scripts/feature_flags.py        ← Sprint 4
backend/scripts/db_migrator.py          ← Sprint 4
backend/scripts/export.py               ← Sprint 5
backend/scripts/dag_planner.py          ← Sprint 5
backend/scripts/prompt_tuner.py         ← Sprint 5
backend/scripts/skill_learner.py        ← Sprint 6
backend/scripts/speculative.py          ← Sprint 6
backend/scripts/tool_registry.py        ← Sprint 6
backend/scripts/error_auto_fix.py       ← Sprint 6
backend/scripts/self_diagnostic.py      ← Sprint 6
backend/scripts/degradation.py          ← Sprint 7
backend/scripts/snapshot_manager.py     ← Sprint 7
backend/scripts/dead_letter_queue.py    ← Sprint 7
backend/scripts/idempotency.py          ← Sprint 7
backend/scripts/gdpr.py                 ← Sprint 8
backend/scripts/retention.py            ← Sprint 8
backend/scripts/voice.py                ← Sprint 9
backend/scripts/vision.py               ← Sprint 9
backend/scripts/doc_processor.py        ← Sprint 9
backend/scripts/local_model.py          ← Sprint 9
backend/scripts/offline_queue.py        ← Sprint 9
backend/scripts/plugin_manager.py       ← Sprint 10
backend/scripts/webhooks.py             ← Sprint 10
backend/scripts/cli.py                  ← Sprint 10
backend/scripts/ab_testing.py           ← Sprint 10
backend/scripts/crash_reporter.py       ← Sprint 10
backend/api_server.py                   ← Sprint 10
backend/tests/                          ← Sprint 4
backend/migrations/                     ← Sprint 4
backend/integrations/                   ← Sprint 8
```

### Files to Modify (existing)
```
backend/server.py                       ← Add new endpoints for each sprint
backend/scripts/worker_pool.py          ← Add cache_control, circuit breaker, streaming
backend/scripts/orchestrator.py         ← Add language detection, smart routing
backend/scripts/memory_manager.py       ← Add GraphMemory as 5th tier
backend/scripts/brain.py                ← Add response cache check, eval judge call
src/stores/appStore.ts                  ← Add new state: approvals, flags, degradation
src/types/index.ts                      ← Add new interfaces
src/lib/api.ts                          ← Add new API functions
src/i18n.ts                             ← Add new translation strings
src/App.tsx                             ← Add new page routes
src/components/layout/Sidebar.tsx       ← Add approvals badge, Cmd+K trigger
src/components/layout/TopBar.tsx        ← Add degradation indicator
src/components/chat/ChatPage.tsx        ← Add eval badges, streaming, export
src/components/dashboard/DashboardPage.tsx ← Add quality trending, DLQ, anomaly
src/components/agents/AgentsPage.tsx    ← Add skill stats, guardrails
src/components/settings/SettingsPage.tsx ← Add feature flags, retention
```

---

## COMPLETION CHECKLIST

When ALL sprints are done, the system should have:
- [ ] 108 total components (up from 15)
- [ ] ~60 Python modules (up from 15)
- [ ] Full test suite (unit + integration + adversarial + chaos)
- [ ] A2A + MCP + OTel protocol compliance
- [ ] 5-layer memory: HOT + WARM + COLD + VECTOR + GRAPH
- [ ] Input + Output security guards + PII filter + Guardrails engine
- [ ] LLM-as-Judge eval + CI/CD quality gate + user feedback loop
- [ ] Human-in-the-loop approval queue for high-risk actions
- [ ] Semantic cache + prompt compression + API caching = ~90% token savings
- [ ] Smart router (ML-based) + circuit breaker + degradation
- [ ] WebSocket real-time + streaming + thinking indicators
- [ ] Plugin system + REST API + CLI + webhooks
- [ ] Voice + image + document + screen understanding
- [ ] Offline mode with local model fallback
- [ ] GDPR compliance + data retention + PII protection
- [ ] Multi-user RBAC + workspaces
- [ ] Auto-update + A/B testing + code signing + crash reporting

**Target Score: 96.4/100 — World #1**
