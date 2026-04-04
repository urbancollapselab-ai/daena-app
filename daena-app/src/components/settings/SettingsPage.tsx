import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import { Globe, Palette, Key, Bot, Bell, Shield, Save, Eye, EyeOff, RotateCcw, Server, Smartphone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/i18n";

const LANGUAGES = [
  { code: "en" as const, name: "English", flag: "🇬🇧" },
  { code: "tr" as const, name: "Türkçe", flag: "🇹🇷" },
  { code: "nl" as const, name: "Nederlands", flag: "🇳🇱" },
  { code: "ku" as const, name: "Kurdî", flag: "☀️" },
];

export function SettingsPage() {
  const { settings, updateSettings, models } = useAppStore();
  const [activeSection, setActiveSection] = useState("general");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [tunneling, setTunneling] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const { t } = useTranslation();

  const SECTIONS = [
    { id: "general", icon: Globe, label: t("nav.settings") + " - " + t("setup.profile")?.split(" ")[0] || "General" },
    { id: "apikeys", icon: Key, label: "API" },
    { id: "models", icon: Server, label: t("chat.models") || "Models" },
    { id: "agents", icon: Bot, label: t("nav.agents") || "Agents" },
    { id: "notifications", icon: Bell, label: "Bildirimler" },
    { id: "mobile", icon: Smartphone, label: "Mobil" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{t("settings.title")}</h2>
          <button onClick={handleSave} className="btn-primary text-xs">
            <Save size={14} /> {saved ? (t("settings.saved") || "Saved!") : (t("settings.save") || "Save Changes")}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Section nav */}
          <nav className="w-44 flex-shrink-0 space-y-1">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  activeSection === sec.id
                    ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <sec.icon size={16} />
                <span>{sec.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 space-y-6"
            >
              {activeSection === "general" && (
                <>
                  <SectionTitle>General Settings</SectionTitle>
                  <SettingRow label="AI Name" description="Customize your AI assistant's name">
                    <input
                      value={settings.aiName}
                      onChange={(e) => updateSettings({ aiName: e.target.value })}
                      className="glass-input px-3 py-2 text-sm w-48"
                    />
                  </SettingRow>
                  <SettingRow label="Company" description="Your company or project name">
                    <input
                      value={settings.companyName}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                      className="glass-input px-3 py-2 text-sm w-48"
                    />
                  </SettingRow>
                  <SettingRow label={t("settings.language") || "Language"} description="">
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => updateSettings({ language: lang.code })}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            settings.language === lang.code
                              ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)] border border-[var(--color-primary)]"
                              : "glass-sm glass-hover text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {lang.flag} {lang.name}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                  <SettingRow label={t("settings.theme") || "Theme"} description="">
                    <div className="flex gap-2">
                      {(["dark", "light", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateSettings({ theme: t })}
                          className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                            settings.theme === t
                              ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)] border border-[var(--color-primary)]"
                              : "glass-sm glass-hover text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                </>
              )}

              {activeSection === "apikeys" && (
                <>
                  <SectionTitle>API Keys</SectionTitle>
                  <ApiKeyInput
                    label="OpenRouter API Key"
                    description="Required. 13 free models available"
                    value={settings.openrouterKey || ""}
                    onChange={(v) => updateSettings({ openrouterKey: v })}
                    show={showKeys["openrouter"]}
                    onToggleShow={() => toggleKeyVisibility("openrouter")}
                    placeholder="sk-or-v1-..."
                  />
                  <ApiKeyInput
                    label="Anthropic API Key"
                    description="Optional. For direct Claude API access"
                    value={settings.anthropicKey || ""}
                    onChange={(v) => updateSettings({ anthropicKey: v })}
                    show={showKeys["anthropic"]}
                    onToggleShow={() => toggleKeyVisibility("anthropic")}
                    placeholder="sk-ant-..."
                  />
                  <ApiKeyInput
                    label="Telegram Bot Token"
                    description="Optional. For Telegram integration"
                    value={settings.telegramToken || ""}
                    onChange={(v) => updateSettings({ telegramToken: v })}
                    show={showKeys["telegram"]}
                    onToggleShow={() => toggleKeyVisibility("telegram")}
                    placeholder="123456:ABC-DEF..."
                  />
                  <SettingRow label="Telegram Chat ID" description="Your Telegram user ID">
                    <input
                      value={settings.telegramChatId || ""}
                      onChange={(e) => updateSettings({ telegramChatId: e.target.value })}
                      className="glass-input px-3 py-2 text-sm w-48 font-mono"
                      placeholder="123456789"
                    />
                  </SettingRow>
                </>
              )}

              {activeSection === "models" && (
                <>
                  <SectionTitle>Model Cascade</SectionTitle>
                  <SettingRow label="Cascade Enabled" description="Automatically try next model on failure">
                    <ToggleSwitch
                      checked={settings.modelCascadeEnabled}
                      onChange={(v) => updateSettings({ modelCascadeEnabled: v })}
                    />
                  </SettingRow>
                  <SettingRow label="Daily Budget" description="Maximum daily spend on paid models">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--color-text-secondary)]">€</span>
                      <input
                        type="number"
                        value={settings.dailyBudget}
                        onChange={(e) => updateSettings({ dailyBudget: parseFloat(e.target.value) || 0 })}
                        className="glass-input px-3 py-2 text-sm w-24 text-right"
                        step="0.5"
                        min="0"
                      />
                    </div>
                  </SettingRow>
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3">Current Model Order</h4>
                    <div className="space-y-1.5">
                      {models.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                          <span className="text-[0.625rem] font-mono text-[var(--color-text-tertiary)] w-5">{i + 1}</span>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: m.tier === "T0" ? "var(--color-accent)"
                                : m.tier === "T1" ? "var(--color-primary)"
                                : m.tier === "T2" ? "var(--color-gold)"
                                : "var(--color-warning)",
                            }}
                          />
                          <span className="text-xs flex-1">{m.name}</span>
                          <span className={`text-[0.625rem] ${m.tier === "T3" ? "text-[var(--color-warning)]" : "text-[var(--color-accent)]"}`}>
                            {m.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeSection === "agents" && (
                <>
                  <SectionTitle>Agent Configuration</SectionTitle>
                  <div className="space-y-2">
                    {[
                      { id: "finance", icon: "💰", name: "Finance" },
                      { id: "data", icon: "📊", name: "Data" },
                      { id: "marketing", icon: "📣", name: "Marketing" },
                      { id: "sales", icon: "🎯", name: "Sales" },
                      { id: "research", icon: "🔬", name: "Research" },
                      { id: "watchdog", icon: "🛡️", name: "Watchdog" },
                      { id: "heartbeat", icon: "💓", name: "Heartbeat" },
                      { id: "coordinator", icon: "🎭", name: "Coordinator" },
                    ].map((ag) => (
                      <div key={ag.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
                        <span className="text-lg">{ag.icon}</span>
                        <span className="text-sm flex-1">{ag.name}</span>
                        <ToggleSwitch
                          checked={settings.agentsEnabled[ag.id] !== false}
                          onChange={(v) => updateSettings({
                            agentsEnabled: { ...settings.agentsEnabled, [ag.id]: v }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeSection === "notifications" && (
                <>
                  <SectionTitle>Notifications</SectionTitle>
                  <SettingRow label="Desktop Notifications" description="Show system notifications">
                    <ToggleSwitch
                      checked={settings.notificationsEnabled}
                      onChange={(v) => updateSettings({ notificationsEnabled: v })}
                    />
                  </SettingRow>
                </>
              )}

              {activeSection === "mobile" && (
                <>
                  <SectionTitle>Mobile Coworking Hub</SectionTitle>
                  <div className="text-center py-6">
                    <Smartphone size={40} className="text-[var(--color-primary)] mx-auto mb-3 opacity-80" />
                    <h3 className="text-sm font-semibold mb-2">Secure Remote Access</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto mb-6">
                      Generate a secure URL to access your Daena Command Center from anywhere. You can share this link with coworkers or open it on your phone.
                    </p>
                    
                    {!tunnelUrl ? (
                      <button 
                        onClick={async () => {
                          setTunneling(true);
                          const { invoke } = await import('@tauri-apps/api/core');
                          try {
                            const res: any = await invoke('start_tunnel');
                            if (res.success) setTunnelUrl(res.url);
                          } catch(err) { console.error(err); }
                          setTunneling(false);
                        }}
                        disabled={tunneling}
                        className="btn-primary mx-auto"
                      >
                        {tunneling ? "Establishing Secure Tunnel..." : "Start Coworking Session"}
                      </button>
                    ) : (
                      <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-2 rounded-xl inline-block shadow-lg mx-auto">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tunnelUrl)}`} alt="QR Code" width={150} height={150} />
                        </div>
                        <div className="glass-sm px-4 py-2 flex items-center justify-between gap-3 max-w-sm mx-auto">
                          <span className="text-xs font-mono text-[var(--color-accent)] truncate select-all">{tunnelUrl}</span>
                          <button onClick={() => navigator.clipboard.writeText(tunnelUrl)} className="text-[var(--color-text-tertiary)] hover:text-white">Copy</button>
                        </div>
                        <button 
                          onClick={async () => {
                            setTunneling(true);
                            const { invoke } = await import('@tauri-apps/api/core');
                            await invoke('stop_tunnel');
                            setTunnelUrl(null);
                            setTunneling(false);
                          }}
                          disabled={tunneling}
                          className="btn-ghost text-xs text-[var(--color-error)] mx-auto hover:bg-[var(--color-error)]/10"
                        >
                          End Remote Session
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold pb-2 border-b border-[var(--color-border)]">{children}</h3>;
}

function SettingRow({ label, description, children }: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[0.625rem] text-[var(--color-text-tertiary)]">{description}</div>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-active)]"
      }`}
      style={{ minWidth: 40, height: 22 }}
    >
      <div
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform"
        style={{
          width: 18, height: 18,
          transform: checked ? "translateX(20px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

function ApiKeyInput({ label, description, value, onChange, show, onToggleShow, placeholder }: {
  label: string; description: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void; placeholder: string;
}) {
  return (
    <SettingRow label={label} description={description}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input px-3 py-2 pr-10 text-sm w-64 font-mono"
          placeholder={placeholder}
        />
        <button
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)]"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </SettingRow>
  );
}
