import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import {
  BookOpen, Calculator, Atom, FlaskConical, Code, Library, Globe,
  Send, Bot, Check, Copy, AlertCircle, Wifi, GraduationCap, Search,
  Newspaper, TrendingUp, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";

const subjects = [
  { id: "Math", label: "Math", icon: Calculator },
  { id: "Physics", label: "Physics", icon: Atom },
  { id: "Chemistry", label: "Chemistry", icon: FlaskConical },
  { id: "Computer Science", label: "CS", icon: Code },
  { id: "Humanities", label: "Humanities", icon: Library },
  { id: "History", label: "History", icon: BookOpen },
  { id: "Current Affairs", label: "Current Affairs", icon: Newspaper },
  { id: "Technology", label: "Technology", icon: Zap },
  { id: "General", label: "General", icon: Globe },
];

const STUDY_EXAMPLES = [
  "Explain the chain rule in calculus with examples",
  "What is Newton's second law?",
  "How does memoization improve performance?",
  "Summarize the causes of World War I",
];

const RESEARCH_EXAMPLES = [
  "What are the latest AI breakthroughs this week?",
  "Current global news headlines today",
  "Recent developments in renewable energy",
  "What happened in the tech industry recently?",
];

type Message = { role: string; content: string; id: string; isWeb?: boolean };
type AppMode = "study" | "research";

export default function Study() {
  const [problem, setProblem] = useState("");
  const [activeSubject, setActiveSubject] = useState("Math");
  const [appMode, setAppMode] = useState<AppMode>("study");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const createConversation = useCreateOpenaiConversation();
  const { streamingContent, isStreaming, streamError, streamMessage } = useChatStream();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Reset chat when switching modes
  const handleModeSwitch = (mode: AppMode) => {
    setAppMode(mode);
    setCurrentChatId(null);
    setMessages([]);
    setProblem("");
    setIsSearching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || isStreaming) return;

    const userMessage = problem.trim();
    setProblem("");

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { role: "user", content: userMessage, id: userMsgId }]);

    if (appMode === "research") setIsSearching(true);

    let chatId = currentChatId;
    if (!chatId) {
      const conv = await createConversation.mutateAsync({
        data: {
          title: userMessage.slice(0, 60),
          mode: appMode === "research" ? "research" : "study",
        },
      });
      chatId = conv.id;
      setCurrentChatId(chatId);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    const contextPrefix = appMode === "study"
      ? `Subject: ${activeSubject}\n\n`
      : "";

    const fullContent = await streamMessage(
      chatId,
      `${contextPrefix}${userMessage}`,
      appMode === "research" ? "research" : "study"
    );

    setIsSearching(false);

    if (fullContent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fullContent,
          id: `assistant-${Date.now()}`,
          isWeb: appMode === "research",
        },
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const examples = appMode === "research" ? RESEARCH_EXAMPLES : STUDY_EXAMPLES;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        {appMode === "research" && (
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[100px] pointer-events-none" />
        )}

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-purple-500/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* Mode toggle */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111118] border border-purple-500/15">
                <button
                  onClick={() => handleModeSwitch("study")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    appMode === "study"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Study
                </button>
                <button
                  onClick={() => handleModeSwitch("research")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    appMode === "research"
                      ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  Research
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    LIVE
                  </span>
                </button>
              </div>

              {appMode === "research" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Powered by Perplexity Sonar — live web search
                </motion.div>
              )}
            </div>

            {/* Subject chips (study mode only) */}
            {appMode === "study" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {subjects.map((subj) => (
                  <button
                    key={subj.id}
                    onClick={() => setActiveSubject(subj.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeSubject === subj.id
                        ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)] border border-purple-400/30"
                        : "bg-[#111118] text-gray-400 border border-purple-500/15 hover:bg-[#1A1A24] hover:text-white"
                    }`}
                  >
                    <subj.icon className="w-3.5 h-3.5" />
                    {subj.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Research topic chips */}
            {appMode === "research" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-wrap gap-2"
              >
                {[
                  { label: "Current Events", icon: Newspaper },
                  { label: "Science & Tech", icon: Zap },
                  { label: "Global Affairs", icon: Globe },
                  { label: "Trending Now", icon: TrendingUp },
                  { label: "Research Papers", icon: Search },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setProblem(`Tell me about ${chip.label.toLowerCase()} today`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#111118] text-gray-400 border border-blue-500/15 hover:bg-blue-600/10 hover:text-blue-300 hover:border-blue-500/30 transition-all"
                  >
                    <chip.icon className="w-3.5 h-3.5" />
                    {chip.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-36">

            {messages.length === 0 && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-5"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  appMode === "research"
                    ? "bg-blue-500/10"
                    : "bg-purple-500/10"
                }`}>
                  {appMode === "research"
                    ? <Wifi className="w-8 h-8 text-blue-400/60" />
                    : <BookOpen className="w-8 h-8 text-purple-500/50" />
                  }
                </div>
                <div>
                  <p className="text-gray-200 font-semibold text-lg">
                    {appMode === "research" ? "Ask anything about the world" : "Ready to help you learn"}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {appMode === "research"
                      ? "Searches the live web for current news, events, and data"
                      : "Select a subject and type your question below"
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-w-lg w-full">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setProblem(ex)}
                      className={`text-left text-xs px-4 py-3 rounded-xl bg-[#111118] border text-gray-400 hover:text-white transition-all ${
                        appMode === "research"
                          ? "border-blue-500/15 hover:border-blue-500/40 hover:bg-blue-600/10"
                          : "border-purple-500/15 hover:border-purple-500/40 hover:bg-[#1A1A24]"
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 ${
                      msg.isWeb
                        ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                        : "bg-purple-600/20 border-purple-500/30 text-purple-400"
                    }`}>
                      {msg.isWeb ? <Wifi className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                    </div>
                  )}

                  <div className={`relative group max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-[#1A1A24] text-gray-200 rounded-2xl px-5 py-3 border border-purple-500/10"
                      : `glass-card rounded-2xl px-7 py-5 border shadow-[0_4px_20px_rgba(0,0,0,0.15)] ${
                          msg.isWeb
                            ? "border-blue-500/20 shadow-[0_4px_20px_rgba(37,99,235,0.06)]"
                            : "border-purple-500/20"
                        }`
                  }`}>
                    {msg.role === "assistant" && (
                      <>
                        {msg.isWeb && (
                          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold mb-3 uppercase tracking-wider">
                            <Wifi className="w-3 h-3" />
                            Live web search result
                          </div>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-[#111118] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-purple-500/20"
                        >
                          {copiedId === msg.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 ${
                  appMode === "research"
                    ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                    : "bg-purple-600/20 border-purple-500/30 text-purple-400"
                }`}>
                  {appMode === "research" ? <Wifi className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`glass-card rounded-2xl px-7 py-5 max-w-[85%] w-full min-h-[80px] border ${
                  appMode === "research" ? "border-blue-500/20" : "border-purple-500/20"
                }`}>
                  {/* Web search indicator */}
                  {isSearching && !streamingContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 text-blue-400 text-sm"
                    >
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs font-medium">Searching the web for latest information...</span>
                    </motion.div>
                  )}
                  {!isSearching && !streamingContent && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                  {streamingContent && (
                    <div className="streaming-cursor">
                      <Markdown content={streamingContent} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

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

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className={`absolute inset-0 rounded-2xl blur-xl transition-colors duration-500 ${
                appMode === "research"
                  ? "bg-blue-600/8 group-hover:bg-blue-600/15"
                  : "bg-purple-600/10 group-hover:bg-purple-600/20"
              }`} />
              <div className={`relative glass-card rounded-2xl p-2 flex items-end border transition-colors ${
                appMode === "research"
                  ? "border-blue-500/20 focus-within:border-blue-500/50"
                  : "border-purple-500/20 focus-within:border-purple-500/50"
              }`}>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                  }}
                  placeholder={
                    appMode === "research"
                      ? "Ask about current events, news, or any topic..."
                      : `Ask a ${activeSubject} question... (Enter to send)`
                  }
                  className="w-full bg-transparent border-none text-white resize-none max-h-40 min-h-[48px] px-4 py-3 focus:ring-0 placeholder:text-gray-500 focus:outline-none leading-relaxed text-sm"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!problem.trim() || isStreaming}
                  className={`mb-1 mr-1 flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm ${
                    appMode === "research"
                      ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                      : "bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:block">
                    {appMode === "research" ? "Search" : "Solve"}
                  </span>
                </button>
              </div>
            </form>
            {appMode === "research" && (
              <p className="text-center mt-2 text-xs text-gray-600">
                Real-time web search via Perplexity Sonar · Results may include today's news and events
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
