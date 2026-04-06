import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { SetupWizard } from "@/components/setup/SetupWizard";

import { ChatPage } from "@/components/chat/ChatPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AgentsPage } from "@/components/agents/AgentsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { X, PlayCircle } from "lucide-react";

export default function App() {
  const { currentPage, setupComplete, setSetupComplete } = useAppStore();

  useEffect(() => {
    import("@/stores/wsTransport").then(m => {
      m.useWSStore.getState().connect();
    });
  }, []);

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />;
  }

  // Determine Tab Title
  const tabTitle = 
    currentPage === "chat" ? "agent_session.chat" :
    currentPage === "dashboard" ? "System_Status.dashboard" :
    currentPage === "agents" ? "Agent_Orchestrator.ts" :
    currentPage === "settings" ? "settings.json" : "welcome.md";

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans select-none">
      
      <Sidebar />

      {/* Main IDE Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        
        {/* Editor Tabs */}
        <div className="flex h-[35px] bg-[#2d2d2d] overflow-x-auto scx">
           <div className="flex items-center gap-2 px-3 bg-[#1e1e1e] border-t-2 border-[#007fd4] min-w-[120px] max-w-[200px] border-r border-[#252526] cursor-pointer">
              <span className="text-[13px] text-white italic truncate flex-1">{tabTitle}</span>
              <button className="text-[#858585] hover:text-white"><X size={14} /></button>
           </div>
        </div>
        
        {/* Breadcrumbs */}
        <div className="px-4 py-1 flex items-center text-[12px] text-[#cccccc] gap-2 border-b border-[#252526]">
          <span>src</span> <Chevron />
          <span>components</span> <Chevron />
          <span className="text-white">{tabTitle}</span>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-hidden relative flex">
          
          <div className="flex-1 min-w-0 overflow-y-auto">
             {currentPage === "chat" && <ChatPage />}
             {currentPage === "dashboard" && <DashboardPage />}
             {currentPage === "agents" && <AgentsPage />}
             {currentPage === "settings" && <SettingsPage />}
          </div>

          {/* This relies on ChatPage rendering ToolExecutionPreview as a modal or split directly inside it, 
              but we can also handle global overlays here if needed. */}

        </div>
        
        {/* Status Bar */}
        <div className="h-[22px] bg-[#007fd4] text-white flex items-center px-3 justify-between text-[11px]">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded"><PlayCircle size={12} /> Daena Core Connected</span>
             <span className="hover:bg-white/20 px-1 rounded cursor-pointer">ws://127.0.0.1:8910</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="hover:bg-white/20 px-1 rounded cursor-pointer">Ln 1, Col 1</span>
             <span className="hover:bg-white/20 px-1 rounded cursor-pointer">UTF-8</span>
             <span className="hover:bg-white/20 px-1 rounded cursor-pointer">TypeScript React</span>
          </div>
        </div>

      </main>
    </div>
  );
}

function Chevron() {
  return <span className="text-[10px] text-[#858585]">&gt;</span>;
}
