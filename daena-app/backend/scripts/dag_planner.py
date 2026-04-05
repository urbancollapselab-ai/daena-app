#!/usr/bin/env python3
"""
Daena Cyclic Engine v5.0 (Formerly DAG Planner)
==============================================
Directed Graph executor allowing CYCLICAL FEEDBACK LOOPS.
Supports LangGraph-style state machine iterations where failed or low-quality
tasks can re-run with internal critiques (Self-Refine architecture).
"""

import time
import uuid
import threading
from typing import Dict, List, Callable, Any

class CyclicEngine:
    def __init__(self, max_iterations=3):
        self.graphs = {}
        self.max_iterations = max_iterations
        
    def create_graph(self, name: str) -> str:
        graph_id = f"graph_{uuid.uuid4().hex[:8]}"
        self.graphs[graph_id] = {
            "name": name,
            "tasks": {},
            "status": "PENDING" # PENDING, RUNNING, COMPLETED, FAILED
        }
        return graph_id
        
    def add_task(self, graph_id: str, task_id: str, agent: str, action: str, depends_on: List[str] = None, critic: str = None):
        if graph_id not in self.graphs:
            raise ValueError("Unknown graph_id")
            
        self.graphs[graph_id]["tasks"][task_id] = {
            "agent": agent,
            "action": action,
            "depends_on": depends_on or [],
            "critic": critic, # If set, this agent evaluates the output
            "status": "PENDING", # PENDING, RUNNING, COMPLETED, FAILED
            "result": None,
            "error": None,
            "attempts": 0,
            "feedback": []
        }

    def execute(self, graph_id: str, executor_callback: Callable[[str, str, Dict], Any], critic_callback: Callable[[str, Any], float] = None) -> Dict:
        """Executes the graph with cycle support and dynamic feedback injection."""
        if graph_id not in self.graphs:
            return {"success": False, "error": "Graph not found"}
            
        graph = self.graphs[graph_id]
        tasks = graph["tasks"]
        graph["status"] = "RUNNING"
        
        resolved = set()
        
        # Max systemic ticks to prevent infinite loops
        max_ticks = len(tasks) * self.max_iterations * 2 
        ticks = 0
        
        while len(resolved) < len(tasks) and ticks < max_ticks:
            ticks += 1
            ready_tasks = []
            for tid, tinfo in tasks.items():
                if tinfo["status"] == "PENDING" and all(dep in resolved for dep in tinfo["depends_on"]):
                    ready_tasks.append(tid)
                    
            if not ready_tasks and len(resolved) < len(tasks):
                # Is there any task currently running? In async it might be, here it's sync.
                # If there are no ready tasks and we haven't resolved everything, we might be deadlocked.
                pass
                
            for tid in ready_tasks.copy():
                tasks[tid]["status"] = "RUNNING"
                tasks[tid]["attempts"] += 1
                
                context = {"feedback": list(tasks[tid]["feedback"])}
                for dep in tasks[tid]["depends_on"]:
                    context[f"result_{dep}"] = tasks[dep]["result"]
                    
                try:
                    result = executor_callback(tasks[tid]["agent"], tasks[tid]["action"], context)
                    
                    # Self-Refine Critique Loop
                    if tasks[tid]["critic"] and critic_callback:
                        score, critique = critic_callback(tasks[tid]["critic"], result)
                        if score < 0.8 and tasks[tid]["attempts"] < self.max_iterations:
                            tasks[tid]["status"] = "PENDING"
                            tasks[tid]["feedback"].append(critique)
                            continue # Cycle back
                            
                    tasks[tid]["status"] = "COMPLETED"
                    tasks[tid]["result"] = result
                    resolved.add(tid)
                except Exception as e:
                    if tasks[tid]["attempts"] < self.max_iterations:
                        tasks[tid]["status"] = "PENDING"
                        tasks[tid]["feedback"].append(f"Crash: {str(e)}")
                    else:
                        tasks[tid]["status"] = "FAILED"
                        tasks[tid]["error"] = str(e)
                        graph["status"] = "FAILED"
                        return {"success": False, "error": f"Task {tid} failed after {self.max_iterations} attempts", "graph": graph}
                        
        if len(resolved) == len(tasks):
            graph["status"] = "COMPLETED"
            return {"success": True, "graph": graph}
        else:
            graph["status"] = "FAILED"
            return {"success": False, "error": "Max ticks exceeded (Infinite Loop / Deadlock)", "graph": graph}

class TaskPlanner:
    """v6.0 Lightweight Causal Task Planner"""
    def __init__(self, engine: CyclicEngine, llm_pool=None):
        self.engine = engine
        self.llm_pool = llm_pool

    def plan_from_prompt(self, prompt: str) -> str:
        """Dynamically parses a prompt into a DAG structure and returns graph_id."""
        print(f"[CausalPlanner] Deconstructing complex prompt into Causal DAG...")
        # In a real run, this uses the LLM pool with JSON output.
        # Here we hardcode a structural breakdown for the v6 blueprint demo.
        graph_name = f"Causal Plan: {prompt[:20]}"
        gid = self.engine.create_graph(graph_name)
        
        # Simulated LLM Causal Decomposition
        if "market" in prompt.lower() or "competitor" in prompt.lower():
            self.engine.add_task(gid, "T1", "research", "Scan internet for market data")
            self.engine.add_task(gid, "T2", "data", "Filter numerical metrics", depends_on=["T1"])
            self.engine.add_task(gid, "T3", "finance", "Extrapolate growth models", depends_on=["T2"], critic="main_brain")
        else:
            self.engine.add_task(gid, "T1", "main_brain", prompt)
            
        return gid

if __name__ == "__main__":
    planner = CyclicEngine()
    print("CyclicEngine Self-Test:\n")
    
    gid = planner.create_graph("Analysis Workflow")
    planner.add_task(gid, "T1", "research", "Find competitors", critic="main_brain")
    
    def mock_executor(agent, action, context):
        print(f"  [Executor] Running {agent}: {action} (Attempts: {len(context.get('feedback', []))+1})")
        return f"Draft output"
        
    def mock_critic(critic_agent, result):
        import random
        # Fake critic 50% chance to fail
        score = random.uniform(0.5, 1.0)
        print(f"  [Critic] {critic_agent} rated {score:.2f}")
        return score, "Not detailed enough. Expand."
        
    print("Executing Cyclic Graph...")
    res = planner.execute(gid, mock_executor, mock_critic)
    print(f"\nResult status: {res['success']}")
    
    # Text causal planner 
    causal_planner = TaskPlanner(planner)
    gid2 = causal_planner.plan_from_prompt("Analyze competitor market share")
    print(f"Generated Causal Graph Nodes: {planner.graphs[gid2]['tasks'].keys()}")
    
    print("\n✅ Cyclic Engine self-test completed")
