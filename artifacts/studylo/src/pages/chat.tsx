import { useState, useRef, useEffect } from "react";
import { useRoute, useSearch } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useGetOpenaiConversation, useListOpenaiMessages } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import { Send, Copy, Bot, User, Check, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const MODE_LABELS: Record<string, string> = {
  study:       "Study",
  research:    "Research",
  "dev-tools": "Dev Tools",
  "vibe-coder":"Vibe Coder",
  notes:       "Notes",
};

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const search = useSearch();
  const id = parseInt(params?.id ?? "0");
  const initialQuery = new URLSearchParams(search).get("q") ?? "";

  const { data: conversation, isLoading: isLoadingConv } = useGetOpenaiConversation(id, {
    query: { enabled: !!id },
  });
  const { data: messages, isLoading: isLoadingMsgs } = useListOpenaiMessages(id, {
    query: { enabled: !!id },
  });

  const { streamingContent, isStreaming, streamError, streamMessage } = useChatStream();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didAutoSend = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (didAutoSend.current || !id || !initialQuery || isLoadingConv || isLoadingMsgs || hasSentInitial) return;
    if (!messages || messages.length === 0) {
      didAutoSend.current = true;
      setHasSentInitial(true);
      streamMessage(id, initialQuery, conversation?.mode ?? "study");
    } else {
      setHasSentInitial(true);
    }
  }, [id, initialQuery, isLoadingConv, isLoadingMsgs, messages, conversation, streamMessage, hasSentInitial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput("");
    await streamMessage(id, userMessage, conversation?.mode ?? "study");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, msgId: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoadingConv || isLoadingMsgs) {
    return (
      <AppLayout>
        <div className="flex-1 p-4 md:p-8 flex flex-col gap-5">
          <Skeleton className="h-8 w-1/2 bg-white/[0.04]" />
          <Skeleton className="h-20 w-3/4 bg-white/[0.04]" />
          <Skeleton className="h-28 w-full bg-white/[0.04]" />
          <Skeleton className="h-16 w-2/3 bg-white/[0.04]" />
        </div>
      </AppLayout>
    );
  }

  const modeLabel = MODE_LABELS[conversation?.mode ?? "study"] ?? conversation?.mode ?? "Chat";

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-5 pb-36">

            {/* Header */}
            <div className="text-center pt-2 pb-4">
              <h1 className="text-lg md:text-2xl font-bold text-white truncate max-w-xs md:max-w-md mx-auto" style={{ fontFamily: "var(--app-font-serif)" }}>
                {conversation?.title ?? "New Chat"}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-400 text-[11px] font-semibold mt-2 uppercase tracking-wider">
                {modeLabel} Mode
              </span>
            </div>

            {/* Optimistic user message */}
            {initialQuery && hasSentInitial && (!messages || messages.length === 0) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-end">
                <div className="max-w-[88%] bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-[0_4px_16px_rgba(109,40,217,0.2)]">
                  <div className="whitespace-pre-wrap break-words">{initialQuery}</div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-white/40 mt-1">
                  <User className="w-4 h-4" />
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`relative group max-w-[88%] break-words ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm"
                      : "glass-card rounded-2xl rounded-tl-sm px-4 md:px-5 py-4 border border-white/[0.07]"
                  }`}>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 text-white/30 hover:text-white bg-white/[0.04] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/[0.06]"
                      >
                        {copiedId === msg.id
                          ? <Check className="w-3.5 h-3.5 text-green-400" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {msg.role === "user"
                      ? <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      : <Markdown content={msg.content} />}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-white/40 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming */}
            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-sm px-4 md:px-5 py-4 max-w-[88%] w-full min-h-[56px] border border-white/[0.07]">
                  {streamingContent
                    ? <div className="streaming-cursor"><Markdown content={streamingContent} /></div>
                    : (
                      <div className="flex items-center gap-1.5 pt-1">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    )}
                </div>
              </motion.div>
            )}

            {streamError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{streamError}</span>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar — pinned above mobile bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 md:px-5 md:py-4 bg-gradient-to-t from-[#080810] via-[#080810]/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="glass-card rounded-2xl p-2 flex items-end border border-white/[0.07] focus-within:border-white/[0.14] transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Studylo…"
                  className="w-full bg-transparent border-none text-white resize-none max-h-32 min-h-[44px] px-3 py-2.5 focus:ring-0 placeholder:text-white/25 focus:outline-none leading-relaxed text-sm"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="mb-1 mr-1 p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed clay-button flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-center mt-1.5 text-[11px] text-white/20 hidden md:block">
              Studylo may make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
