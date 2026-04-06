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
import { TopBar } from "@/components/layout/TopBar";

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
    
    // Connect WebSockets immediately for ultra-low latency streams
    import("@/stores/wsTransport").then(m => {
      m.useWSStore.getState().connect();
    });
  }, [setSetupComplete]);

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-deep)] relative overflow-hidden text-neutral-200 font-sans">
      {/* Ambient Glow Orbs — GPU-friendly (use CSS classes, not inline blur) */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Subtle grid pattern for depth */}
      <div className="absolute inset-0 grid-pattern pointer-events-none z-0" />

      {/* Overlays */}
      {showVoiceMode && <VoiceMode onClose={() => setShowVoiceMode(false)} />}
      {showMobilePairing && <MobilePairing onClose={() => setShowMobilePairing(false)} />}

      <Sidebar />

      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          <div className="flex w-full h-full gap-4 lg:gap-6">
            {/* Active Content */}
            <div
              className={`transition-all duration-500 ease-out min-w-0 ${
                currentPage === "chat" ? "flex-[2]" : "flex-1"
              } glass rounded-2xl overflow-hidden`}
            >
              {currentPage === "chat" && <ChatPage />}
              {currentPage === "dashboard" && <DashboardPage />}
              {currentPage === "agents" && <AgentsPage />}
              {currentPage === "settings" && <SettingsPage />}
            </div>

            {/* Live System Monitor — only on chat page */}
            {currentPage === "chat" && (
              <div className="hidden xl:block flex-1 min-w-[280px] max-w-[420px] h-full fade-in">
                <SystemMonitor />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
