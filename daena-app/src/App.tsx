import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { SetupWizard } from "@/components/SetupWizard"; // Updated path to new cinematic wizard
import { SystemMonitor } from "@/components/SystemMonitor"; // New interactive DAG map
import { VoiceMode } from "@/components/VoiceMode";
import { MobilePairing } from "@/components/MobilePairing";

import { ChatPage } from "@/components/chat/ChatPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AgentsPage } from "@/components/agents/AgentsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

declare global {
  interface Window {
    toggleVoiceMode: () => void;
    toggleMobilePairing: () => void;
  }
}

export default function App() {
  const { currentPage, setupComplete, setSetupComplete } = useAppStore();
  
  // Local state for UI overlays
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showMobilePairing, setShowMobilePairing] = useState(false);

  // Expose these controllers globally so any component can trigger them
  useEffect(() => {
    window.toggleVoiceMode = () => setShowVoiceMode(v => !v);
    window.toggleMobilePairing = () => setShowMobilePairing(v => !v);
    
    // v10.0.5 Cache Buster and Setup Restorer
    const currentVersion = "10.0.5";
    if (localStorage.getItem("daena_version") !== currentVersion) {
      localStorage.setItem("daena_version", currentVersion);
      setSetupComplete(false); // Force the setup wizard to appear once to guarantee optimal state loaded
    }
  }, [setSetupComplete]);

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#050505] relative overflow-hidden text-neutral-200 font-sans">
      {/* Premium Dark Glassmorphism Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

      {/* Overlays */}
      {showVoiceMode && <VoiceMode onClose={() => setShowVoiceMode(false)} />}
      {showMobilePairing && <MobilePairing onClose={() => setShowMobilePairing(false)} />}

      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 w-full">
        <TopBar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="flex w-full h-full gap-6">
            
            {/* Active Content Context */}
            <div className={`transition-all duration-500 ${currentPage === 'chat' ? 'w-2/3' : 'w-full'} bg-neutral-900/40 backdrop-blur-3xl border border-neutral-800/80 rounded-2xl shadow-xl overflow-hidden`}>
              {currentPage === "chat" && <ChatPage />}
              {currentPage === "dashboard" && <DashboardPage />}
              {currentPage === "agents" && <AgentsPage />}
              {currentPage === "settings" && <SettingsPage />}
            </div>

            {/* Live System Monitor (Only shown statically next to Chat for that WOW factor) */}
            {currentPage === "chat" && (
              <div className="w-1/3 h-full animate-in slide-in-from-right-8 duration-700">
                 <SystemMonitor />
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
