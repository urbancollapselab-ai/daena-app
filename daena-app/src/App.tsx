import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { ChatPage } from "@/components/chat/ChatPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { AgentsPage } from "@/components/agents/AgentsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function App() {
  const { currentPage, setupComplete } = useAppStore();

  if (!setupComplete) {
    return <SetupWizard />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-deep)] relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Main layout */}
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {currentPage === "chat" && <ChatPage />}
          {currentPage === "dashboard" && <DashboardPage />}
          {currentPage === "agents" && <AgentsPage />}
          {currentPage === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
