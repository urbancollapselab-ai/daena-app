import { useAppStore } from "@/stores/appStore";
import {
  MessageSquare, LayoutDashboard, Copy, Settings,
  TerminalSquare, Box, Play, Check, ChevronDown, ChevronRight, Hash
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const { currentPage, setPage, conversations, activeConversationId, setActiveConversation, addConversation } = useAppStore();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);

  // Filter basically today / older if needed, or just list all
  const sortedConvs = [...conversations].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="h-full flex bg-[#1e1e1e] border-r border-[#3c3c3c] select-none text-[#cccccc]">
      
      {/* Activity Bar (Icon Rail) */}
      <div className="w-[48px] flex-shrink-0 flex flex-col items-center py-2 bg-[#333333] border-r border-[#252526]">
        {/* Top Icons */}
        <div className="flex flex-col gap-4 w-full items-center">
          <NavIcon id="chat" icon={MessageSquare} active={currentPage === "chat"} onClick={() => {setPage("chat"); setExplorerOpen(true);}} />
          <NavIcon id="dashboard" icon={LayoutDashboard} active={currentPage === "dashboard"} onClick={() => {setPage("dashboard"); setExplorerOpen(true);}} />
          <NavIcon id="agents" icon={Box} active={currentPage === "agents"} onClick={() => {setPage("agents"); setExplorerOpen(true);}} />
        </div>
        
        {/* Bottom Icons */}
        <div className="mt-auto flex flex-col gap-4 w-full items-center mb-2">
          <NavIcon id="logs" icon={TerminalSquare} active={false} onClick={() => {}} />
          <NavIcon id="settings" icon={Settings} active={currentPage === "settings"} onClick={() => setPage("settings")} />
        </div>
      </div>

      {/* Explorer Panel */}
      {explorerOpen && (
        <div className="w-[250px] flex-shrink-0 flex flex-col bg-[#252526]">
          {/* Header */}
          <div className="px-5 py-3 text-[11px] font-semibold tracking-wider text-[#cccccc] uppercase flex items-center justify-between">
            <span>Explorer</span>
            <button className="text-[#cccccc] hover:text-white transition-colors" onClick={() => addConversation()}>+</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Folder: Open Editors (Simulated Dashboard) */}
            <div className="flex flex-col">
              <div 
                className="flex items-center gap-1 hover:bg-[#2a2d2e] py-1 px-1 cursor-pointer"
                onClick={() => setActivityOpen(!activityOpen)}
              >
                {activityOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-[11px] font-bold uppercase">Workspace</span>
              </div>
              
              {activityOpen && (
                <div className="flex flex-col ml-4">
                   <FileItem 
                     name="System_Status.dashboard" 
                     active={currentPage === "dashboard"} 
                     onClick={() => setPage("dashboard")} 
                     iconColor="text-blue-400"
                   />
                   <FileItem 
                     name="Agent_Orchestrator.ts" 
                     active={currentPage === "agents"} 
                     onClick={() => setPage("agents")} 
                     iconColor="text-yellow-400"
                   />
                </div>
              )}
            </div>

            {/* Folder: Conversations */}
            <div className="flex flex-col mt-4">
              <div className="flex items-center gap-1 hover:bg-[#2a2d2e] py-1 px-1 cursor-pointer">
                <ChevronDown size={14} />
                <span className="text-[11px] font-bold uppercase">Chats</span>
              </div>
              
              <div className="flex flex-col ml-4">
                {sortedConvs.map(conv => (
                   <FileItem 
                     key={conv.id}
                     name={conv.title || "new_session.ts"} 
                     active={currentPage === "chat" && activeConversationId === conv.id} 
                     onClick={() => {
                        setActiveConversation(conv.id);
                        setPage("chat");
                     }}
                     isChat={true}
                   />
                ))}
                {sortedConvs.length === 0 && (
                   <div className="px-6 py-2 text-xs text-[#666666] italic">No active sessions</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function NavIcon({ id, icon: Icon, active, onClick }: { id: string, icon: any, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center justify-center p-2 text-[#858585] hover:text-white transition-colors ${active ? "text-white" : ""}`}
    >
      <Icon size={24} strokeWidth={active ? 2 : 1.5} />
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#007fd4] rounded-r-md" />
      )}
    </button>
  );
}

function FileItem({ name, active, onClick, iconColor, isChat }: { name: string, active: boolean, onClick: () => void, iconColor?: string, isChat?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 pl-2 pr-4 py-1 text-[13px] cursor-pointer ${active ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-[#cccccc]"}`}
    >
      {isChat ? <Hash size={14} className="text-[#cccccc]" /> : <LayoutDashboard size={14} className={iconColor || "text-[#cccccc]"} />}
      <span className="truncate">{name}</span>
    </div>
  );
}
