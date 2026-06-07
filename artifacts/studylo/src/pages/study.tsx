import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import {
  BookOpen, Calculator, Atom, FlaskConical, Code, Library, Globe,
  Send, Bot, Check, Copy, AlertCircle, Wifi, GraduationCap, Search,
  Newspaper, TrendingUp, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";

const subjects = [
  { id: "Math",             label: "Math",          icon: Calculator },
  { id: "Physics",          label: "Physics",        icon: Atom },
  { id: "Chemistry",        label: "Chemistry",      icon: FlaskConical },
  { id: "Computer Science", label: "CS",             icon: Code },
  { id: "Humanities",       label: "Humanities",     icon: Library },
  { id: "History",          label: "History",        icon: BookOpen },
  { id: "Current Affairs",  label: "Current Affairs",icon: Newspaper },
  { id: "Technology",       label: "Technology",     icon: Zap },
  { id: "General",          label: "General",        icon: Globe },
];

const STUDY_EXAMPLES = [
  "Explain the chain rule in calculus",
  "What is Newton's second law?",
  "How does memoization work?",
  "Causes of World War I",
];

const RESEARCH_EXAMPLES = [
  "Latest AI breakthroughs this week",
  "Current global news headlines",
  "Recent renewable energy developments",
  "Tech industry news today",
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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
        data: { title: userMessage.slice(0, 60), mode: appMode === "research" ? "research" : "study" },
      });
      chatId = conv.id;
      setCurrentChatId(chatId);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    const contextPrefix = appMode === "study" ? `Subject: ${activeSubject}\n\n` : "";
    const fullContent = await streamMessage(chatId, `${contextPrefix}${userMessage}`, appMode);

    setIsSearching(false);

    if (fullContent) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent, id: `assistant-${Date.now()}`, isWeb: appMode === "research" },
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const examples = appMode === "research" ? RESEARCH_EXAMPLES : STUDY_EXAMPLES;
  const isResearch = appMode === "research";

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">

        {/* ── Sticky header ── */}
        <div className="flex-shrink-0 border-b border-white/[0.05] bg-[#080810]/90 backdrop-blur-xl sticky top-0 z-10 px-3 py-3 md:px-5 md:py-4">
          <div className="max-w-3xl mx-auto space-y-3">

            {/* Mode toggle row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => handleModeSwitch("study")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    !isResearch ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(109,40,217,0.3)]" : "text-white/45 hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Study</span>
                  <span className="xs:hidden">Study</span>
                </button>
                <button
                  onClick={() => handleModeSwitch("research")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isResearch ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]" : "text-white/45 hover:text-white"
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  Research
                  <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    LIVE
                  </span>
                </button>
              </div>

              {isResearch && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/15 text-blue-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="hidden sm:inline">Perplexity Sonar · live web</span>
                  <span className="sm:hidden">Live web</span>
                </div>
              )}
            </div>

            {/* Subject chips — horizontally scrollable on mobile */}
            {!isResearch && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
                {subjects.map((subj) => (
                  <button
                    key={subj.id}
                    onClick={() => setActiveSubject(subj.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeSubject === subj.id
                        ? "bg-violet-600 text-white"
                        : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white"
                    }`}
                  >
                    <subj.icon className="w-3 h-3" />
                    {subj.label}
                  </button>
                ))}
              </div>
            )}

            {/* Research topic chips */}
            {isResearch && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
                {[
                  { label: "Current Events", icon: Newspaper },
                  { label: "Science & Tech", icon: Zap },
                  { label: "Global Affairs", icon: Globe },
                  { label: "Trending", icon: TrendingUp },
                  { label: "Research", icon: Search },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setProblem(`Tell me about ${chip.label.toLowerCase()} today`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-white/[0.04] text-white/40 border border-blue-500/10 hover:bg-blue-600/10 hover:text-blue-300 hover:border-blue-500/25 transition-all flex-shrink-0"
                  >
                    <chip.icon className="w-3 h-3" />
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 md:px-5 py-5 space-y-5 pb-36">

            {messages.length === 0 && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-4"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isResearch ? "bg-blue-500/10" : "bg-violet-500/10"}`}>
                  {isResearch
                    ? <Wifi className="w-7 h-7 text-blue-400/50" />
                    : <BookOpen className="w-7 h-7 text-violet-400/50" />}
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {isResearch ? "Ask anything about the world" : "Ready to help you learn"}
                  </p>
                  <p className="text-white/35 text-sm mt-1">
                    {isResearch ? "Searches the live web for current data" : "Select a subject and ask your question"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setProblem(ex)}
                      className={`text-left text-xs px-4 py-3 rounded-xl bg-white/[0.03] border text-white/40 hover:text-white transition-all ${
                        isResearch
                          ? "border-blue-500/10 hover:border-blue-500/25 hover:bg-blue-600/8"
                          : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
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
                  transition={{ duration: 0.22 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 ${
                      msg.isWeb ? "bg-blue-600/20 border-blue-500/20 text-blue-400" : "bg-violet-600/20 border-violet-500/20 text-violet-400"
                    }`}>
                      {msg.isWeb ? <Wifi className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  <div className={`relative group max-w-[88%] break-words ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm"
                      : `glass-card rounded-2xl rounded-tl-sm px-4 md:px-5 py-4 border ${msg.isWeb ? "border-blue-500/15" : "border-white/[0.07]"}`
                  }`}>
                    {msg.role === "assistant" && (
                      <>
                        {msg.isWeb && (
                          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold mb-2.5 uppercase tracking-wider">
                            <Wifi className="w-3 h-3" /> Live web search result
                          </div>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 text-white/30 hover:text-white bg-white/[0.04] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/[0.06]"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                    {msg.role === "user"
                      ? <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      : <Markdown content={msg.content} />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming */}
            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 ${isResearch ? "bg-blue-600/20 border-blue-500/20 text-blue-400" : "bg-violet-600/20 border-violet-500/20 text-violet-400"}`}>
                  {isResearch ? <Wifi className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`glass-card rounded-2xl rounded-tl-sm px-4 md:px-5 py-4 max-w-[88%] w-full min-h-[56px] border ${isResearch ? "border-blue-500/15" : "border-white/[0.07]"}`}>
                  {isSearching && !streamingContent && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <span className="text-xs">Searching the web…</span>
                    </div>
                  )}
                  {!isSearching && !streamingContent && (
                    <div className="flex gap-1 pt-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                  {streamingContent && <div className="streaming-cursor"><Markdown content={streamingContent} /></div>}
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

        {/* ── Input bar ── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 md:px-5 md:py-4 bg-gradient-to-t from-[#080810] via-[#080810]/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className={`glass-card rounded-2xl p-2 flex items-end border transition-colors ${
                isResearch
                  ? "border-blue-500/15 focus-within:border-blue-500/35"
                  : "border-white/[0.07] focus-within:border-white/[0.14]"
              }`}>
                <textarea
                  ref={textareaRef}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  placeholder={isResearch ? "Ask about current events, news…" : `Ask a ${activeSubject} question…`}
                  className="w-full bg-transparent border-none text-white resize-none max-h-32 min-h-[44px] px-3 py-2.5 focus:ring-0 placeholder:text-white/25 focus:outline-none leading-relaxed text-sm"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!problem.trim() || isStreaming}
                  className={`mb-1 mr-1 flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm clay-button flex-shrink-0 ${
                    isResearch ? "bg-blue-600 hover:bg-blue-500" : "bg-violet-600 hover:bg-violet-500"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{isResearch ? "Search" : "Ask"}</span>
                </button>
              </div>
            </form>
            {isResearch && (
              <p className="text-center mt-1.5 text-[11px] text-white/20 hidden md:block">
                Real-time web search via Perplexity Sonar
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
