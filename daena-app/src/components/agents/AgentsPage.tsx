import { useAppStore } from "@/stores/appStore";
import { PlayCircle, StopCircle, TerminalSquare } from "lucide-react";

const TASK_LOGS = {
  main_brain: "[DAEMON-01] Orchestrating core processes.",
  finance: "[WAITING] No invoice payload detected.",
  data: "[SCRAPING] LinkedIn session active. Extracted 42 items.",
  marketing: "[IDLE] Campaign templates cached.",
  sales: "[CRON] Next batch execution in 14m.",
  research: "[COMPUTING] Tokenizing pdf_reports/q3_earnings.pdf",
  watchdog: "[LISTENING] Socket bound to *:8910",
  heartbeat: "[SLEEP] Ping in 4m.",
  coordinator: "[IDLE] Routing table clear.",
};

export function AgentsPage() {
  const { agents, updateAgent } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-6 font-mono text-[13px] text-[#cccccc] bg-[#1e1e1e]">
       <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#3c3c3c]">
             <TerminalSquare size={16} className="text-[#858585]" />
             <h2 className="text-[14px] uppercase tracking-wider font-bold">Subagent Daemon Control</h2>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded p-1 shadow-lg">
             <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#3c3c3c] text-[11px] text-[#858585] uppercase tracking-wider bg-[#2d2d2d]">
                <div className="col-span-3">Process ID / Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-5">Live Output Stream</div>
                <div className="col-span-2">Actions</div>
             </div>

             <div className="divide-y divide-[#3c3c3c]">
                {agents.map(agent => {
                   const isActive = agent.status === "active" || agent.status === "running" || agent.status === "monitoring";
                   const log = (TASK_LOGS as any)[agent.id] || "[NULL] Awaiting instruction.";
                   
                   return (
                     <div key={agent.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#2a2d2e] transition-colors">
                        <div className="col-span-3 flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#89d185] animate-pulse' : 'bg-[#666666]'}`} />
                           <span className="font-bold text-white">{agent.name}</span>
                        </div>
                        <div className="col-span-2">
                           <span className={`px-2 py-0.5 rounded text-[11px] ${isActive ? 'bg-[#0e639c]/20 text-[#007fd4]' : 'bg-[#3c3c3c]/50 text-[#858585]'}`}>
                             {agent.status.toUpperCase()}
                           </span>
                        </div>
                        <div className="col-span-5 text-[#858585] truncate">
                           {log}
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                           <button 
                             onClick={() => {
                               if (!isActive) updateAgent(agent.id, { status: "active" });
                               else if (agent.id !== "main_brain") updateAgent(agent.id, { status: "idle" });
                             }}
                             className="text-[#858585] hover:text-white transition-colors p-1"
                           >
                             {isActive ? <StopCircle size={14} className="hover:text-[#f48771]" /> : <PlayCircle size={14} className="hover:text-[#89d185]" />}
                           </button>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

       </div>
    </div>
  );
}
