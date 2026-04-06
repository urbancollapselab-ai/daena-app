import { useAppStore } from "@/stores/appStore";
import {
  Search, LayoutDashboard, Users, Workflow, Hexagon, Database,
  TerminalSquare, Settings, UserCircle, HelpCircle, ChevronDown, Fingerprint
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const { currentPage, setPage, agents } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  const activeAgentCount = agents.filter(a => a.status !== "idle" && a.status !== "error").length;

  const TOP_NAV = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { id: "chat" as const, icon: Workflow, label: "Orchestration" },
    { id: "agents" as const, icon: Users, label: "Agents", badge: activeAgentCount },
    { id: "models" as const, icon: Hexagon, label: "Models" },
    { id: "knowledge" as const, icon: Database, label: "Knowledge Base" },
    { id: "logs" as const, icon: TerminalSquare, label: "Logs" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ];

  const BOTTOM_NAV = [
    { id: "account" as const, icon: UserCircle, label: "Account" },
    { id: "help" as const, icon: HelpCircle, label: "Help" },
  ];

  return (
    <aside className="w-[260px] h-full bg-[#11131C] border-r border-white/5 flex flex-col z-20 font-sans text-white/70">
      
      {/* Brand Logo & Name */}
      <div className="h-[72px] px-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#6C63FF] grid place-items-center shrink-0">
          <Fingerprint size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-[15px] tracking-wide text-white/90 leading-none">AETHER AI</h1>
          <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Command Center</span>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search Agents, Flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-[#6C63FF] rounded-lg pl-9 pr-3 py-2 text-xs font-medium outline-none transition-all placeholder:text-white/30 text-white/90 focus:bg-[#1A1C23]"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {TOP_NAV.map((item) => {
          const isActive = currentPage === item.id || (currentPage === "chat" && item.id === "chat");
          return (
            <button
              key={item.id}
              onClick={() => {
                if (["chat", "dashboard", "agents", "settings"].includes(item.id)) {
                  setPage(item.id as any);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                isActive 
                  ? "bg-white/10 text-white" 
                  : "hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className={isActive ? "text-white" : "text-white/40 group-hover:text-white/70 transition-colors"} />
                {item.label}
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#6C63FF]/20 text-[#6C63FF]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">Admin</div>
        
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-white/5 hover:text-white/90 transition-all text-white/70"
          >
            <item.icon size={16} className="text-white/40" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-400 grid place-items-center text-white font-bold text-xs shrink-0 shadow-lg">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/90 truncate leading-tight">Alex S.</p>
            <p className="text-[10px] text-white/40 truncate">Lead Engineer</p>
          </div>
          <ChevronDown size={14} className="text-white/30 shrink-0" />
        </button>
      </div>

    </aside>
  );
}
