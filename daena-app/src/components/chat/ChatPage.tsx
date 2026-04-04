import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { sendMessage, getModelDisplayName, isModelFree } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Sparkles, ArrowDown, Clock, Zap, Bot, User, Copy, Check } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ChatMessage } from "@/types";

const QUICK_ACTIONS = [
  { icon: "\ud83d\udcb0", label: "Create Invoice", desc: "Finance agent", prompt: "@finance Create an invoice" },
  { icon: "\ud83d\udcca", label: "Find Leads", desc: "Data agent", prompt: "@data Find new leads in my industry" },
  { icon: "\ud83d\udce3", label: "Write Content", desc: "Marketing agent", prompt: "@marketing Write a social media post" },
  { icon: "\ud83d\udd2c", label: "Research", desc: "Research agent", prompt: "@research Analyze market trends" },
  { icon: "\ud83c\udfaf", label: "Sales Outreach", desc: "Sales agent", prompt: "@sales Draft a cold email template" },
  { icon: "\ud83e\udde0", label: "System Status", desc: "Main Brain", prompt: "Show me the current system status" },
];

const AGENT_ICONS: Record<string, string> = {
  finance: "\ud83d\udcb0", data: "\ud83d\udcca", marketing: "\ud83d\udce3",
  sales: "\ud83c\udfaf", research: "\ud83d\udd2c", watchdog: "\ud83d\udee1\ufe0f",
  heartbeat: "\ud83d\udc93", coordinator: "\ud83c\udfad", main_brain: "\ud83e\udde0",
};

export function ChatPage() {
  const {
    conversations, activeConversationId, addConversation,
    addMessage, isLoading, setLoading, agents,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");

    let convId = activeConversationId;
    if (!convId) { convId = addConversation(); }

    let targetAgent: string | undefined;
    const mentionMatch = text.match(/@(\w+)/);
    if (mentionMatch) {
      const mentioned = mentionMatch[1].toLowerCase();
      const agent = agents.find((a) => a.id === mentioned || a.name.toLowerCase() === mentioned);
      if (agent) targetAgent = agent.id;
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(convId, userMsg);
    setLoading(true);

    try {
      const result = await sendMessage(text, targetAgent);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: result.response,
        model: result.model,
        agent: result.agent,
        timestamp: new Date().toISOString(),
        tokens: result.tokens,
        latencyMs: result.latency_ms,
      };
      addMessage(convId, assistantMsg);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "Backend is not responding. Please check that the Daena backend is running on port 8910.",
        timestamp: new Date().toISOString(),
      };
      addMessage(convId, errorMsg);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 ? (
          <EmptyState onQuickAction={handleQuickAction} t={t} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full glass border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] z-30 transition-all"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="glass-sm flex items-end gap-2 p-2.5 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_var(--color-primary-dim)] transition-all">
            <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] flex-shrink-0 mb-0.5 transition-colors">
              <Paperclip size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.empty")}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] py-2 max-h-32 leading-relaxed"
              style={{ minHeight: "36px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "36px";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
            <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] flex-shrink-0 mb-0.5 transition-colors">
              <Mic size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl flex-shrink-0 mb-0.5 transition-all ${
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-[var(--color-primary)] to-[#8B7BFF] text-white shadow-lg shadow-[var(--color-primary-dim)] hover:shadow-[var(--color-primary-glow)]"
                  : "text-[var(--color-text-tertiary)]"
              }`}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[0.5625rem] text-center text-[var(--color-text-tertiary)] mt-2">
            {t("chat.footnote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onQuickAction, t }: { onQuickAction: (p: string) => void; t: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        {/* Logo */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-20 blur-xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-2xl shadow-[var(--color-primary-dim)]">
            <Sparkles size={40} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent">
          How can I help?
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-10">
          8 AI agents, 20 models, one command center
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {QUICK_ACTIONS.map((qa, i) => (
            <motion.button
              key={qa.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              onClick={() => onQuickAction(qa.prompt)}
              className="glass-sm glass-hover p-4 text-left group"
            >
              <span className="text-2xl mb-3 block">{qa.icon}</span>
              <div className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{qa.label}</div>
              <div className="text-[0.625rem] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">{qa.desc}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const agentIcon = message.agent ? AGENT_ICONS[message.agent] || "\ud83e\udde0" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.03 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? "" : ""}`}>
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[#8B7BFF] flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-sm">
            {agentIcon || "\ud83e\udde0"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Agent label */}
        {!isUser && message.agent && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            <span className="text-[0.6875rem] font-semibold capitalize" style={{
              color: message.agent === "finance" ? "#00D4AA" : message.agent === "data" ? "#22D3EE" :
                message.agent === "marketing" ? "#FB7185" : message.agent === "sales" ? "#FFB547" :
                message.agent === "research" ? "#A78BFA" : "#6C63FF",
            }}>
              {message.agent}
            </span>
            <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">agent</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed group relative ${
            isUser
              ? "bg-gradient-to-r from-[var(--color-primary)] to-[#8B7BFF] text-white rounded-tr-md shadow-lg shadow-[var(--color-primary-dim)]"
              : "glass-sm text-[var(--color-text-primary)] rounded-tl-md"
          }`}
        >
          <div className="markdown-content whitespace-pre-wrap">{message.content}</div>

          {/* Copy button */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
            >
              {copied ? <Check size={12} className="text-[var(--color-accent)]" /> : <Copy size={12} className="text-[var(--color-text-tertiary)]" />}
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-2.5 mt-1.5 ${isUser ? "justify-end" : ""} px-1`}>
          <span className="text-[0.5625rem] text-[var(--color-text-tertiary)] flex items-center gap-1">
            <Clock size={9} />
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && message.model && (
            <span className={`model-tag ${isModelFree(message.model) ? "!text-[var(--color-accent)] !border-[var(--color-accent-dim)]" : "!text-[var(--color-warning)] !border-[var(--color-warning-dim)]"}`}>
              <Zap size={8} />
              {getModelDisplayName(message.model)}
              {isModelFree(message.model) ? " FREE" : ""}
            </span>
          )}
          {!isUser && message.latencyMs != null && (
            <span className="text-[0.5rem] text-[var(--color-text-tertiary)] font-mono">
              {message.latencyMs}ms
            </span>
          )}
          {!isUser && message.tokens != null && (
            <span className="text-[0.5rem] text-[var(--color-text-tertiary)] font-mono">
              {message.tokens} tok
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-sm">
        {"\ud83e\udde0"}
      </div>
      <div className="glass-sm rounded-2xl rounded-tl-md px-5 py-4">
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}
