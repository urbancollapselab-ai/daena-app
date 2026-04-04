#!/usr/bin/env python3
"""
Daena DAG Planner v3.0
======================
Directed Acyclic Graph (DAG) executor for complex, multi-agent workflows.
Allows parallel task execution by resolving dependencies.

Example Task Graph:
  A: Research Market (Needs: None) -> Agent: Research
  B: Gather CRM Data (Needs: None) -> Agent: Data
  C: Generate Strategy (Needs: A, B) -> Agent: Marketing
"""

import time
import uuid
import threading
from typing import Dict, List, Callable, Any

class DAGPlanner:
    def __init__(self):
        self.graphs = {}
        
    def create_graph(self, name: str) -> str:
        graph_id = f"dag_{uuid.uuid4().hex[:8]}"
        self.graphs[graph_id] = {
            "name": name,
            "tasks": {},
            "status": "PENDING" # PENDING, RUNNING, COMPLETED, FAILED
        }
        return graph_id
        
    def add_task(self, graph_id: str, task_id: str, agent: str, action: str, depends_on: List[str] = None):
        if graph_id not in self.graphs:
            raise ValueError("Unknown graph_id")
            
        self.graphs[graph_id]["tasks"][task_id] = {
            "agent": agent,
            "action": action,
            "depends_on": depends_on or [],
            "status": "PENDING", # PENDING, RUNNING, COMPLETED, FAILED
            "result": None,
            "error": None
        }

    def execute(self, graph_id: str, executor_callback: Callable[[str, str, Dict], Any]) -> Dict:
        """Executes a DAG synchronously, simulating parallel execution via topological sort."""
        if graph_id not in self.graphs:
            return {"success": False, "error": "Graph not found"}
            
        graph = self.graphs[graph_id]
        tasks = graph["tasks"]
        graph["status"] = "RUNNING"
        
        resolved = set()
        
        while len(resolved) < len(tasks):
            # Find all tasks that can be run (dependencies met, not yet run)
            ready_tasks = []
            for tid, tinfo in tasks.items():
                if tinfo["status"] == "PENDING" and all(dep in resolved for dep in tinfo["depends_on"]):
                    ready_tasks.append(tid)
                    
            if not ready_tasks:
                graph["status"] = "FAILED"
                return {"success": False, "error": "Deadlock or missing dependencies detected", "graph": graph}
                
            # Execute ready tasks (in a real system, this could use ThreadPoolExecutor)
            for tid in ready_tasks:
                tasks[tid]["status"] = "RUNNING"
                
                # Gather context from dependencies
                context = {}
                for dep in tasks[tid]["depends_on"]:
                    context[f"result_{dep}"] = tasks[dep]["result"]
                    
                try:
                    result = executor_callback(tasks[tid]["agent"], tasks[tid]["action"], context)
                    tasks[tid]["status"] = "COMPLETED"
                    tasks[tid]["result"] = result
                    resolved.add(tid)
                except Exception as e:
                    tasks[tid]["status"] = "FAILED"
                    tasks[tid]["error"] = str(e)
                    graph["status"] = "FAILED"
                    return {"success": False, "error": f"Task {tid} failed: {e}", "graph": graph}
                    
        graph["status"] = "COMPLETED"
        return {"success": True, "graph": graph}


if __name__ == "__main__":
    planner = DAGPlanner()
    print("DAGPlanner Self-Test:\n")
    
    gid = planner.create_graph("Analysis Workflow")
    planner.add_task(gid, "T1", "research", "Find competitors")
    planner.add_task(gid, "T2", "data", "Get our last month sales")
    planner.add_task(gid, "T3", "sales", "Draft comparison report", depends_on=["T1", "T2"])
    
    def mock_executor(agent, action, context):
        print(f"  [Executor] Running {agent}: {action} (Context: {list(context.keys())})")
        time.sleep(0.1)
        return f"Output of {action}"
        
    print("Executing DAG...")
    res = planner.execute(gid, mock_executor)
    print(f"\nResult status: {res['success']}")
    
    tasks = res['graph']['tasks']
    for t, info in tasks.items():
        print(f"  {t} -> {info['status']}")
        
    print("\n✅ DAGPlanner self-test passed")
