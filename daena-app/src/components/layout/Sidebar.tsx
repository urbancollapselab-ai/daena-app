import { useAppStore } from "@/stores/appStore";
import {
  MessageSquare, LayoutDashboard, Users, Settings, Plus,
  Pin, Trash2, PanelLeftClose, PanelLeft, Search, Radio
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";

export function Sidebar() {
  const { t } = useTranslation();
  const {
    currentPage, setPage, conversations, activeConversationId,
    addConversation, setActiveConversation, deleteConversation,
    sidebarCollapsed, toggleSidebar, agents,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);

  const activeAgentCount = agents.filter(a => a.status !== "idle" && a.status !== "error").length;

  const NAV_ITEMS = [
    { id: "chat" as const, icon: MessageSquare, label: t("nav.chat") },
    { id: "dashboard" as const, icon: LayoutDashboard, label: t("nav.dashboard") },
    { id: "agents" as const, icon: Users, label: t("nav.agents"), badge: activeAgentCount },
    { id: "settings" as const, icon: Settings, label: t("nav.settings") },
  ];

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayConvs = filtered.filter((c) => {
    const d = new Date(c.createdAt);
    return d.toDateString() === new Date().toDateString();
  });
  const olderConvs = filtered.filter((c) => {
    const d = new Date(c.createdAt);
    return d.toDateString() !== new Date().toDateString();
  });

  return (
    <motion.aside
      className="flex flex-col h-full border-r border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur-xl relative z-20"
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)]">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-[var(--color-primary-dim)]">
              <img src="/daena-logo.png" alt="Daena" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide">Daena</span>
              <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] ml-1.5">v1.0</span>
            </div>
          </motion.div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-xl overflow-hidden mx-auto shadow-lg shadow-[var(--color-primary-dim)]">
            <img src="/daena-logo.png" alt="Daena" className="w-full h-full object-cover" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] transition-colors"
        >
          <PanelLeft size={16} />
        </button>
      )}

      {/* Navigation */}
      <nav className="px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${
                isActive
                  ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-primary)]"
                />
              )}
              <item.icon size={18} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge != null && (
                    <span className="text-[0.5625rem] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <>
          {/* New Chat + Search */}
          <div className="px-3 py-2 space-y-2 border-t border-[var(--color-border)]">
            <button
              onClick={() => { addConversation(); setPage("chat"); }}
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              <Plus size={14} /> {t("nav.newChat")}
            </button>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder={t("nav.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {todayConvs.length > 0 && (
              <div className="px-2 py-1.5">
                <span className="text-[0.5625rem] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">{t("nav.today")}</span>
              </div>
            )}
            {todayConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                title={conv.title}
                active={conv.id === activeConversationId}
                pinned={conv.pinned}
                hovered={hoveredConv === conv.id}
                onMouseEnter={() => setHoveredConv(conv.id)}
                onMouseLeave={() => setHoveredConv(null)}
                onClick={() => { setActiveConversation(conv.id); setPage("chat"); }}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))}

            {olderConvs.length > 0 && (
              <div className="px-2 py-1.5 mt-2">
                <span className="text-[0.5625rem] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">{t("nav.previous") || "Previous"}</span>
              </div>
            )}
            {olderConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                title={conv.title}
                active={conv.id === activeConversationId}
                pinned={conv.pinned}
                hovered={hoveredConv === conv.id}
                onMouseEnter={() => setHoveredConv(conv.id)}
                onMouseLeave={() => setHoveredConv(null)}
                onClick={() => { setActiveConversation(conv.id); setPage("chat"); }}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-10 text-center text-[var(--color-text-tertiary)] text-xs">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </div>
            )}
          </div>

          {/* Bottom Status */}
          <div className="px-3 py-3 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">
                {activeAgentCount} agents active
              </span>
              <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] ml-auto">20 models</span>
            </div>
          </div>
        </>
      )}
    </motion.aside>
  );
}

function ConvItem({
  title, active, pinned, hovered, onClick, onDelete, onMouseEnter, onMouseLeave,
}: {
  title: string; active: boolean; pinned: boolean; hovered: boolean;
  onClick: () => void; onDelete: () => void;
  onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs transition-all ${
        active
          ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)] border-l-2 border-[var(--color-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
      }`}
    >
      {pinned && <Pin size={10} className="text-[var(--color-warning)] flex-shrink-0" />}
      <MessageSquare size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
      <span className="truncate flex-1">{title}</span>
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-md hover:bg-[var(--color-error-dim)] text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
          >
            <Trash2 size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
