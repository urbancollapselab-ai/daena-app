import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { SystemMonitor } from "@/components/SystemMonitor";
import { VoiceMode } from "@/components/VoiceMode";
import { MobilePairing } from "@/components/MobilePairing";

import { ChatPage } from "@/components/chat/ChatPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AgentsPage } from "@/components/agents/AgentsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Sidebar } from "@/components/layout/Sidebar";

declare global {
  interface Window {
    toggleVoiceMode: () => void;
    toggleMobilePairing: () => void;
  }
}

export default function App() {
  const { currentPage, setupComplete, setSetupComplete } = useAppStore();

  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showMobilePairing, setShowMobilePairing] = useState(false);

  useEffect(() => {
    window.toggleVoiceMode = () => setShowVoiceMode((v) => !v);
    window.toggleMobilePairing = () => setShowMobilePairing((v) => !v);

    const currentVersion = "10.0.6";
    if (localStorage.getItem("daena_version") !== currentVersion) {
      localStorage.setItem("daena_version", currentVersion);
      setSetupComplete(false);
    }
    
    import("@/stores/wsTransport").then(m => {
      m.useWSStore.getState().connect();
    });
  }, [setSetupComplete]);

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#060810] relative overflow-hidden text-white/90 font-sans">
      
      {/* Overlays */}
      {showVoiceMode && <VoiceMode onClose={() => setShowVoiceMode(false)} />}
      {showMobilePairing && <MobilePairing onClose={() => setShowMobilePairing(false)} />}

      <Sidebar />

      <main className="flex-1 flex w-full h-full p-4 lg:p-6 gap-6 min-w-0">
        
        {/* Central Content Area (Chat/Settings/etc) */}
        <div className={`transition-all duration-500 ease-out min-w-0 bg-[#0C0E16] border border-white/5 rounded-2xl overflow-hidden shadow-xl ${
            currentPage === "chat" ? "flex-[2]" : "flex-1"
        }`}>
          {currentPage === "chat" && <ChatPage />}
          {currentPage === "dashboard" && <DashboardPage />}
          {currentPage === "agents" && <AgentsPage />}
          {currentPage === "settings" && <SettingsPage />}
        </div>

        {/* Live System Monitor/Terminal (Option 2 right side) */}
        <div className="hidden xl:flex flex-1 min-w-[280px] max-w-[380px] h-full flex-col">
          <SystemMonitor />
        </div>

      </main>
    </div>
  );
}
