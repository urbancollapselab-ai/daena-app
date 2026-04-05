import uuid
import asyncio

class AgentInstance:
    def __init__(self, name: str, is_ephemeral: bool = False):
        self.id = uuid.uuid4().hex[:8]
        self.name = name
        self.is_ephemeral = is_ephemeral
        self.load = 0
        self.memory_state = []

    def serialize_state(self):
        return {
            "id": self.id,
            "name": self.name,
            "load": self.load,
            "memory": self.memory_state
        }
        
    async def kill(self):
        self.load = -1 # Mark as dead
        print(f"[Swarm] Agent {self.name}-{self.id} terminated.")

class SwarmManager:
    def __init__(self, base_agents: list):
        self.agents = [AgentInstance(name) for name in base_agents]
        self.ephemeral_workers = []

    def get_agent(self, name: str) -> AgentInstance:
        # Find least loaded agent of this type
        candidates = [a for a in self.agents + self.ephemeral_workers if a.name == name and a.load >= 0]
        if not candidates:
            return None
        return min(candidates, key=lambda x: x.load)

    async def scale_for_task(self, agent_name: str, task_complexity: int):
        needed = min(task_complexity // 3, 3)  # Spawn up to 3 ephemeral workers
        for i in range(needed):
            worker = AgentInstance(agent_name, is_ephemeral=True)
            self.ephemeral_workers.append(worker)
            print(f"[Swarm] Spawning ephemeral worker: {worker.name}-{worker.id}")

    async def cleanup(self):
        for w in self.ephemeral_workers:
            await w.kill()
        self.ephemeral_workers.clear()

swarm = SwarmManager(["finance", "data", "marketing", "sales", "research", "coordinator", "terminal"])
