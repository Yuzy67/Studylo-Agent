import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, BookOpen, Code2, Zap, FileText, ArrowRight, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { StudyloMark } from "@/components/ui/studylo-logo";

const placeholders = [
  "Explain quantum entanglement step by step...",
  "Write a Next.js auth template with JWT...",
  "Summarise the causes of the French Revolution...",
  "Debug this React infinite re-render bug...",
  "Generate a PRD for a task management SaaS...",
  "What happened in the AI world this week?",
];

const modes = [
  { id: "study",     label: "Study",       icon: BookOpen, desc: "Step-by-step tutor" },
  { id: "research",  label: "Research",    icon: Wifi,     desc: "Live web search" },
  { id: "dev-tools", label: "Dev Tools",   icon: Code2,    desc: "PRDs & boilerplate" },
  { id: "vibe-coder",label: "Vibe Coder",  icon: Zap,      desc: "Cursor / v0 prompts" },
  { id: "notes",     label: "Notes",       icon: FileText, desc: "Flashcards" },
];

const features = [
  {
    title: "Study Assistant",
    desc: "Step-by-step explanations with real-world analogies for any subject.",
    icon: BookOpen,
    link: "/study",
    cta: "Open",
  },
  {
    title: "Live Research",
    desc: "Ask about current events, news, and recent developments — powered by live web search.",
    icon: Wifi,
    link: "/study",
    cta: "Open",
  },
  {
    title: "Dev Co-Pilot",
    desc: "PRDs, TRDs, sitemaps, and production-ready code from a one-line description.",
    icon: Code2,
    link: "/dev-tools",
    cta: "Open",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeMode, setActiveMode] = useState("study");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createConversation = useCreateOpenaiConversation();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || createConversation.isPending) return;
    createConversation.mutate(
      { data: { title: query.slice(0, 60), mode: activeMode } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setLocation(`/chat/${data.id}?q=${encodeURIComponent(query)}`);
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto relative bg-[#080810]">

        {/* Very subtle ambient — much smaller, lower opacity */}
        <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] bg-violet-700/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 pt-20 pb-24 relative z-10 flex flex-col items-center">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center mb-10 space-y-5"
          >
            {/* Logomark inline above title */}
            <div className="flex justify-center mb-2">
              <StudyloMark size={44} />
            </div>

            <h1 className="text-4xl md:text-[52px] font-bold text-white tracking-tight leading-[1.1]" style={{ fontFamily: "var(--app-font-serif)" }}>
              Your AI study &<br />
              <span className="text-gradient">dev companion.</span>
            </h1>
            <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed">
              Ask anything — from calculus proofs to current world events to shipping your next side project.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="w-full max-w-2xl space-y-3"
          >
            <form onSubmit={handleSearch} className="relative">
              <div className="relative glass-card rounded-2xl p-2 flex items-center border border-white/[0.07] focus-within:border-white/[0.14] transition-colors duration-200">
                <div className="pl-3.5 pr-2 text-white/30">
                  <Search className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
                </div>
                <div className="flex-1 relative h-11 flex items-center">
                  <AnimatePresence mode="wait">
                    {!query && (
                      <motion.div
                        key={placeholderIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center text-white/25 pointer-events-none text-[15px]"
                      >
                        {placeholders[placeholderIndex]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-[15px] focus:ring-0 placeholder:text-transparent focus:outline-none"
                    placeholder=" "
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim() || createConversation.isPending}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-1 clay-button flex items-center gap-1.5 flex-shrink-0"
                >
                  {createConversation.isPending ? "Starting…" : "Ask"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Mode chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {modes.map((mode) => {
                const active = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    title={mode.desc}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-violet-600/25 text-violet-300 border border-violet-500/30"
                        : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70"
                    }`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl mt-16"
          >
            {features.map((feature, i) => (
              <button
                key={i}
                onClick={() => setLocation(feature.link)}
                className="group text-left p-5 rounded-2xl border border-white/[0.06] hover:border-white/[0.11] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-600/12 flex items-center justify-center text-violet-400/80 mb-4 group-hover:bg-violet-600/20 transition-colors">
                  <feature.icon className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
                </div>
                <h3 className="text-white/90 font-semibold text-sm mb-1.5">{feature.title}</h3>
                <p className="text-white/35 text-xs leading-relaxed mb-4">{feature.desc}</p>
                <div className="flex items-center gap-1 text-violet-400/60 text-xs font-medium group-hover:text-violet-400 group-hover:gap-1.5 transition-all">
                  {feature.cta}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
