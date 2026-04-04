import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { sendMessage, getModelDisplayName, isModelFree } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Sparkles, ArrowDown } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ChatMessage } from "@/types";

const QUICK_ACTIONS = [
  { icon: "💰", label: "Create Invoice", prompt: "@finance Create an invoice" },
  { icon: "📊", label: "Find Leads", prompt: "@data Find new leads in my industry" },
  { icon: "📣", label: "Write Content", prompt: "@marketing Write a social media post" },
  { icon: "🔬", label: "Research", prompt: "@research Analyze market trends" },
];

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

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

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
    if (!convId) {
      convId = addConversation();
    }

    // Detect @agent mentions
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
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "⚠️ Failed to get response. Please check that the backend is running.",
        timestamp: new Date().toISOString(),
      };
      addMessage(convId, errorMsg);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
          <div className="max-w-3xl mx-auto space-y-4">
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
            className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 rounded-full glass border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] z-30"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/50 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="glass-sm flex items-end gap-2 p-2">
            <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] flex-shrink-0 mb-0.5">
              <Paperclip size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.empty")}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] py-2 max-h-32"
              style={{ minHeight: "36px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "36px";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] flex-shrink-0 mb-0.5">
              <Mic size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg flex-shrink-0 mb-0.5 transition-all ${
                input.trim() && !isLoading
                  ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  : "text-[var(--color-text-tertiary)]"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[0.625rem] text-center text-[var(--color-text-tertiary)] mt-1.5">
            {t("chat.footnote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onQuickAction, t }: { onQuickAction: (p: string) => void, t: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-[var(--color-primary-dim)]">
          <Sparkles size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("setup.welcome")?.split(" v1")[0] || "How can I help?"}</h2>
        <p className="text-[var(--color-text-secondary)] text-sm mb-8">
          {t("setup.welcomeDesc") || "8 AI agents, 20 models, one command center"}
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => onQuickAction(qa.prompt)}
              className="glass-sm glass-hover p-4 text-left transition-all"
            >
              <span className="text-2xl mb-2 block">{qa.icon}</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{qa.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "order-1" : ""}`}>
        {/* Agent indicator */}
        {!isUser && message.agent && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <span className="text-xs">
              {message.agent === "finance" ? "💰" : message.agent === "data" ? "📊" :
               message.agent === "marketing" ? "📣" : message.agent === "sales" ? "🎯" :
               message.agent === "research" ? "🔬" : "🧠"}
            </span>
            <span className="text-[0.625rem] text-[var(--color-text-tertiary)] capitalize">{message.agent}</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-[var(--color-primary)] text-white rounded-br-md"
              : "glass-sm text-[var(--color-text-primary)] rounded-bl-md"
          }`}
        >
          <div className="markdown-content whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : ""} px-1`}>
          <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && message.model && (
            <span className={`model-tag ${isModelFree(message.model) ? "text-[var(--color-accent)]" : "text-[var(--color-warning)]"}`}>
              {getModelDisplayName(message.model)}
              {isModelFree(message.model) ? " · FREE" : ""}
            </span>
          )}
          {!isUser && message.latencyMs && (
            <span className="text-[0.5625rem] text-[var(--color-text-tertiary)]">
              {message.latencyMs}ms
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
      className="flex justify-start"
    >
      <div className="glass-sm rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}
