import { useAppStore } from "@/stores/appStore";
import { MessageSquare, LayoutDashboard, Users, Settings, Plus, Pin, Trash2, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";

export function Sidebar() {
  const { t } = useTranslation();
  const {
    currentPage, setPage, conversations, activeConversationId,
    addConversation, setActiveConversation, deleteConversation,
    sidebarCollapsed, toggleSidebar,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);

  const NAV_ITEMS = [
    { id: "chat" as const, icon: MessageSquare, label: t("nav.chat") },
    { id: "dashboard" as const, icon: LayoutDashboard, label: t("nav.dashboard") },
    { id: "agents" as const, icon: Users, label: t("nav.agents") },
    { id: "settings" as const, icon: Settings, label: t("nav.settings") },
  ];

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayConvs = filtered.filter((c) => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const olderConvs = filtered.filter((c) => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  return (
    <motion.aside
      className="flex flex-col h-full border-r border-[var(--color-border)] bg-[var(--color-bg-card)] relative z-20"
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)]">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-sm font-bold shadow-sm">
              D
            </div>
            <span className="font-semibold text-sm tracking-wide">Daena</span>
          </motion.div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] transition-colors"
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <>
          {/* New Chat + Search */}
          <div className="px-3 py-2 space-y-2 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                addConversation();
                setPage("chat");
              }}
              className="btn-primary w-full justify-center text-xs py-2"
            >
              <Plus size={14} /> {t("nav.newChat")}
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
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
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
            {todayConvs.length > 0 && (
              <div className="px-2 py-1">
                <span className="text-[0.625rem] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{t("nav.today")}</span>
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
              <div className="px-2 py-1 mt-2">
                <span className="text-[0.625rem] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{t("nav.previous") || "Previous"}</span>
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
              <div className="px-3 py-8 text-center text-[var(--color-text-tertiary)] text-xs">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </div>
            )}
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
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-all ${
        active
          ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
      }`}
    >
      {pinned && <Pin size={10} className="text-[var(--color-warning)] flex-shrink-0" />}
      <span className="truncate flex-1">{title}</span>
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-[var(--color-error-dim)] text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
          >
            <Trash2 size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
