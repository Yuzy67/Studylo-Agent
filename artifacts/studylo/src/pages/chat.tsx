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
  study: "Study",
  research: "Research",
  "dev-tools": "Dev Tools",
  "vibe-coder": "Vibe Coder",
  notes: "Notes",
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

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Send initial query from home page search box
  useEffect(() => {
    if (
      didAutoSend.current ||
      !id ||
      !initialQuery ||
      isLoadingConv ||
      isLoadingMsgs ||
      hasSentInitial
    ) return;

    // Only send if there are no existing messages
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
        <div className="flex-1 p-8 flex flex-col gap-6">
          <Skeleton className="h-10 w-1/2 bg-purple-500/10" />
          <Skeleton className="h-24 w-3/4 bg-purple-500/10" />
          <Skeleton className="h-32 w-full bg-purple-500/10" />
          <Skeleton className="h-20 w-2/3 bg-purple-500/10" />
        </div>
      </AppLayout>
    );
  }

  const modeLabel = MODE_LABELS[conversation?.mode ?? "study"] ?? conversation?.mode ?? "Chat";

  // Show initial query as optimistic user message while loading
  const showOptimisticQuery = initialQuery && !hasSentInitial || (hasSentInitial && isStreaming && (!messages || messages.length === 0));

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-36">
            {/* Header */}
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-white font-serif truncate max-w-md mx-auto">
                {conversation?.title ?? "New Chat"}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mt-3 uppercase tracking-wider">
                {modeLabel} Mode
              </div>
            </div>

            {/* Optimistic user message while initial query streams */}
            {initialQuery && hasSentInitial && (!messages || messages.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-end"
              >
                <div className="max-w-[85%] bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.2)]">
                  <div className="whitespace-pre-wrap">{initialQuery}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#1A1A24] border border-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
              </motion.div>
            )}

            {/* Persisted messages */}
            <AnimatePresence initial={false}>
              {messages?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.15)]"
                        : "glass-card rounded-2xl rounded-tl-sm px-6 py-4"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-[#111118] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-purple-500/20"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A24] border border-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400 mt-1">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming response */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-sm px-6 py-4 max-w-[85%] w-full min-h-[60px]">
                  {streamingContent ? (
                    <div className="streaming-cursor">
                      <Markdown content={streamingContent} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-400">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Error state */}
            {streamError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{streamError}</span>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-xl group-hover:bg-purple-600/20 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex items-end border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Studylo... (Enter to send, Shift+Enter for newline)"
                  className="w-full bg-transparent border-none text-white resize-none max-h-40 min-h-[48px] px-4 py-3 focus:ring-0 placeholder:text-gray-500 focus:outline-none leading-relaxed"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="mb-1 mr-1 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
            <p className="text-center mt-2 text-xs text-gray-600">
              Studylo may make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
