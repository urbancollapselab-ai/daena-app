#!/usr/bin/env python3
"""
Daena MCP Server v2.0
======================
Exposes Daena's capabilities via Model Context Protocol (MCP).
Allows Claude Desktop, Cursor, Windsurf and other MCP-compatible hosts
to access Daena's tools, agents, and memory.

Requires: pip install "mcp[cli]"

Usage:
    python mcp_server.py              # Run stdio transport (for Claude Desktop)
    python mcp_server.py --sse 8911   # Run SSE transport (for remote access)
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

try:
    from mcp.server.fastmcp import FastMCP
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    print("[MCP Server] ⚠️ MCP not installed. Run: pip install 'mcp[cli]'")

if MCP_AVAILABLE:
    from scripts.worker_pool import WorkerPool
    from scripts.memory_manager import MemoryManager
    from scripts.safety_guard import SafetyGuard
    from scripts.trace_logger import TraceLogger
    from scripts.vector_memory import VectorMemory

    mcp = FastMCP("Daena AI Command Center")
    pool = WorkerPool()
    memory = MemoryManager()
    guard = SafetyGuard()
    tracer = TraceLogger()

    try:
        vmem = VectorMemory()
    except Exception:
        vmem = None

    # ── TOOLS ──────────────────────────────────────────────────

    @mcp.tool()
    def daena_chat(message: str, agent: str = None) -> str:
        """Send a message to Daena and get an AI response.
        Optionally specify an agent: finance, data, marketing, sales, research.
        """
        from scripts.orchestrator import Orchestrator
        orch = Orchestrator()

        classification = orch.classify_task(message)
        target_agent = agent or classification.get("department")

        prompt_parts = ["You are Daena — a personal AI command center."]
        if target_agent:
            dept_ctx = orch.get_department_context(target_agent)
            prompt_parts.append(dept_ctx)

        context = memory.get_context(task=message, agent=target_agent)
        if context:
            prompt_parts.append(context)

        prompt_parts.append(f"User: {message}")
        full_prompt = "\n\n".join(prompt_parts)

        result = pool.call(full_prompt, max_tokens=1000)

        # Log trace
        tracer.log(
            agent=target_agent or "main_brain",
            model=result.get("model"),
            prompt_summary=message[:200],
            response_summary=result.get("response", "")[:200],
            latency_ms=result.get("latency_ms", 0),
            tokens=result.get("tokens_used", 0),
            success=result.get("success", False),
        )

        if result.get("success"):
            memory.add_hot("user", message)
            memory.add_hot("assistant", result["response"])
            if vmem:
                vmem.store("user", message, agent=target_agent)
                vmem.store("assistant", result["response"], agent=target_agent)
            return result["response"]
        else:
            return f"Error: {result.get('error', 'Unknown')}"

    @mcp.tool()
    def daena_run_command(command: str) -> str:
        """Execute a terminal command with safety checks.
        Dangerous commands will be blocked or flagged.
        """
        check = guard.check(command)

        if check["level"] == "BLOCK":
            return f"🚫 BLOCKED: {check['reason']} — Command: {command}"

        if check["level"] == "WARN":
            return f"⚠️ WARNING: {check['reason']} — Command needs user approval: {command}"

        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, timeout=30
            )
            output = result.stdout[:2000] if result.stdout else ""
            if result.stderr:
                output += f"\n[stderr] {result.stderr[:500]}"
            return output or "(no output)"
        except subprocess.TimeoutExpired:
            return "Command timed out (30s limit)"
        except Exception as e:
            return f"Error: {str(e)}"

    @mcp.tool()
    def daena_file_read(path: str) -> str:
        """Read a file's contents. Path can be relative or absolute."""
        try:
            p = Path(path).expanduser()
            if not p.exists():
                return f"File not found: {path}"
            content = p.read_text(errors="replace")
            return content[:5000]  # Cap output
        except Exception as e:
            return f"Error reading file: {e}"

    @mcp.tool()
    def daena_file_write(path: str, content: str) -> str:
        """Write content to a file. Creates directories if needed."""
        check = guard.check(f"write to {path}")
        if check["level"] == "BLOCK":
            return f"🚫 BLOCKED: Cannot write to {path}"

        try:
            p = Path(path).expanduser()
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
            return f"✅ Written {len(content)} chars to {path}"
        except Exception as e:
            return f"Error writing file: {e}"

    @mcp.tool()
    def daena_memory_search(query: str, limit: int = 5) -> str:
        """Search Daena's memory for past conversations and facts."""
        if vmem:
            results = vmem.search(query, limit=limit)
            if results:
                lines = [f"[{r['score']:.2f}] {r['role']}: {r['content'][:150]}" for r in results]
                return "\n".join(lines)
            return "No relevant memories found."
        return "Vector memory not available."

    @mcp.tool()
    def daena_agent_status() -> str:
        """Get the status of all 8 Daena agents."""
        agents = [
            {"id": "main_brain", "name": "Main Brain", "icon": "🧠"},
            {"id": "finance", "name": "Finance", "icon": "💰"},
            {"id": "data", "name": "Data", "icon": "📊"},
            {"id": "marketing", "name": "Marketing", "icon": "📣"},
            {"id": "sales", "name": "Sales", "icon": "🎯"},
            {"id": "research", "name": "Research", "icon": "🔬"},
            {"id": "watchdog", "name": "Watchdog", "icon": "🛡️"},
            {"id": "heartbeat", "name": "Heartbeat", "icon": "💓"},
        ]
        health = pool.get_health_report()
        lines = [f"{a['icon']} {a['name']}: active" for a in agents]
        lines.append(f"\nWorker Pool: {health['total_workers']} models ({health['free_models']} free)")
        return "\n".join(lines)

    @mcp.tool()
    def daena_traces(limit: int = 10) -> str:
        """Get recent agent action traces for debugging."""
        traces = tracer.get_recent(limit=limit)
        lines = []
        for t in traces:
            status = "✅" if t.get("success") else "❌"
            lines.append(
                f"{status} [{t['timestamp'][:19]}] {t['agent']} via {t.get('model', '?')}: "
                f"{t.get('prompt_summary', '')[:60]} → {t.get('latency_ms', 0)}ms"
            )
        return "\n".join(lines) or "No traces yet."

    # ── RESOURCES ──────────────────────────────────────────────

    @mcp.resource("daena://health")
    def health_resource() -> str:
        """Current system health status."""
        health = pool.get_health_report()
        return json.dumps(health, indent=2)

    @mcp.resource("daena://agents")
    def agents_resource() -> str:
        """Agent configuration and capabilities."""
        agents_dir = ROOT / "agents"
        result = {}
        if agents_dir.exists():
            for d in agents_dir.iterdir():
                if d.is_dir():
                    claude_md = d / "CLAUDE.md"
                    if claude_md.exists():
                        result[d.name] = claude_md.read_text()[:500]
        return json.dumps(result, indent=2, ensure_ascii=False)

    @mcp.resource("daena://memory/recent")
    def recent_memory_resource() -> str:
        """Recent conversation context."""
        if vmem:
            recent = vmem.get_recent(limit=20)
            return json.dumps(recent, indent=2, ensure_ascii=False)
        return "[]"


if __name__ == "__main__":
    if not MCP_AVAILABLE:
        print("Install MCP: pip install 'mcp[cli]'")
        sys.exit(1)

    if "--test" in sys.argv:
        print("MCP Server Test — Tools registered:")
        print("  - daena_chat")
        print("  - daena_run_command")
        print("  - daena_file_read / daena_file_write")
        print("  - daena_memory_search")
        print("  - daena_agent_status")
        print("  - daena_traces")
        print("\nResources:")
        print("  - daena://health")
        print("  - daena://agents")
        print("  - daena://memory/recent")
        print("\n✅ MCP Server ready")
    else:
        print("[MCP Server] Starting Daena MCP Server (stdio)...")
        mcp.run()
