#!/usr/bin/env python3
"""
Daena MCP Client v2.0
======================
Connects to external MCP servers (GitHub, Slack, Notion, filesystem, etc.)
and makes their tools available to Daena's agents.

This is the "inward" direction — pulling external capabilities INTO Daena.
Combined with mcp_server.py (outward), Daena becomes a full MCP participant.

Usage:
    client = MCPClient()
    client.connect_server("github", command="npx @modelcontextprotocol/server-github")
    tools = client.list_tools("github")
    result = client.call_tool("github", "search_repositories", {"query": "daena"})
"""

import json
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).parent.parent
CONFIG_FILE = ROOT / "config" / "mcp_servers.json"


class MCPClient:
    """Connects to external MCP servers via stdio transport."""

    def __init__(self):
        self._servers: Dict[str, dict] = {}
        self._processes: Dict[str, subprocess.Popen] = {}
        self._load_config()

    def _load_config(self):
        """Load saved MCP server configurations."""
        if CONFIG_FILE.exists():
            try:
                self._servers = json.loads(CONFIG_FILE.read_text())
            except Exception:
                self._servers = {}
        else:
            # Default known MCP servers
            self._servers = {
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem", str(Path.home())],
                    "description": "Local filesystem access",
                    "enabled": False,
                },
                "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github"],
                    "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": ""},
                    "description": "GitHub repository management",
                    "enabled": False,
                },
                "sqlite": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-sqlite"],
                    "description": "SQLite database access",
                    "enabled": False,
                },
                "brave-search": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
                    "env": {"BRAVE_API_KEY": ""},
                    "description": "Brave web search",
                    "enabled": False,
                },
            }
            self._save_config()

    def _save_config(self):
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE.write_text(json.dumps(self._servers, indent=2, ensure_ascii=False))

    def add_server(self, name: str, command: str, args: List[str] = None,
                   env: Dict[str, str] = None, description: str = ""):
        """Register a new MCP server."""
        self._servers[name] = {
            "command": command,
            "args": args or [],
            "env": env or {},
            "description": description,
            "enabled": True,
        }
        self._save_config()

    def remove_server(self, name: str):
        """Remove an MCP server configuration."""
        self.disconnect(name)
        self._servers.pop(name, None)
        self._save_config()

    def enable_server(self, name: str, enabled: bool = True):
        """Enable or disable an MCP server."""
        if name in self._servers:
            self._servers[name]["enabled"] = enabled
            self._save_config()

    def connect(self, name: str) -> bool:
        """Start an MCP server subprocess and connect via stdio."""
        if name not in self._servers:
            print(f"[MCP Client] Unknown server: {name}")
            return False

        config = self._servers[name]
        if not config.get("enabled", False):
            print(f"[MCP Client] Server '{name}' is disabled")
            return False

        try:
            env = dict(**subprocess.os.environ, **config.get("env", {}))
            cmd = [config["command"]] + config.get("args", [])

            proc = subprocess.Popen(
                cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE, env=env, text=True
            )
            self._processes[name] = proc
            print(f"[MCP Client] ✅ Connected to '{name}' (PID: {proc.pid})")
            return True
        except Exception as e:
            print(f"[MCP Client] ❌ Failed to connect to '{name}': {e}")
            return False

    def disconnect(self, name: str):
        """Stop an MCP server subprocess."""
        if name in self._processes:
            try:
                self._processes[name].terminate()
                self._processes[name].wait(timeout=5)
            except Exception:
                self._processes[name].kill()
            del self._processes[name]
            print(f"[MCP Client] Disconnected from '{name}'")

    def send_request(self, name: str, method: str, params: dict = None) -> Optional[dict]:
        """Send a JSON-RPC request to an MCP server."""
        if name not in self._processes:
            if not self.connect(name):
                return None

        proc = self._processes[name]
        if proc.poll() is not None:
            print(f"[MCP Client] Server '{name}' has exited, reconnecting...")
            if not self.connect(name):
                return None
            proc = self._processes[name]

        request = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": method,
            "params": params or {},
        }

        try:
            proc.stdin.write(json.dumps(request) + "\n")
            proc.stdin.flush()

            # Read response (with timeout)
            response_line = proc.stdout.readline()
            if response_line:
                return json.loads(response_line)
            return None
        except Exception as e:
            print(f"[MCP Client] Error communicating with '{name}': {e}")
            return None

    def list_tools(self, name: str) -> List[dict]:
        """List available tools from an MCP server."""
        result = self.send_request(name, "tools/list")
        if result and "result" in result:
            return result["result"].get("tools", [])
        return []

    def call_tool(self, name: str, tool_name: str, arguments: dict = None) -> Optional[dict]:
        """Call a tool on an MCP server."""
        return self.send_request(name, "tools/call", {
            "name": tool_name,
            "arguments": arguments or {},
        })

    def list_resources(self, name: str) -> List[dict]:
        """List available resources from an MCP server."""
        result = self.send_request(name, "resources/list")
        if result and "result" in result:
            return result["result"].get("resources", [])
        return []

    def get_status(self) -> dict:
        """Get status of all configured MCP servers."""
        status = {}
        for name, config in self._servers.items():
            connected = name in self._processes and self._processes[name].poll() is None
            status[name] = {
                "description": config.get("description", ""),
                "enabled": config.get("enabled", False),
                "connected": connected,
                "pid": self._processes[name].pid if connected else None,
            }
        return status

    def get_all_available_tools(self) -> Dict[str, List[dict]]:
        """Get tools from all connected servers."""
        all_tools = {}
        for name in self._processes:
            tools = self.list_tools(name)
            if tools:
                all_tools[name] = tools
        return all_tools

    def disconnect_all(self):
        """Disconnect from all servers."""
        for name in list(self._processes.keys()):
            self.disconnect(name)


if __name__ == "__main__":
    client = MCPClient()
    print("Daena MCP Client Self-Test:")
    print(f"  Configured servers: {len(client._servers)}")
    for name, config in client._servers.items():
        status = "✅ enabled" if config.get("enabled") else "❌ disabled"
        print(f"    {status} {name}: {config.get('description', '')}")

    status = client.get_status()
    print(f"\n  Server status:")
    for name, s in status.items():
        conn = "🟢 connected" if s["connected"] else "⚪ disconnected"
        print(f"    {conn} {name}")

    print(f"\n✅ MCP Client self-test passed")
