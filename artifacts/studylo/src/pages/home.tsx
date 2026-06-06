import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, BookOpen, Code2, Zap, FileText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";

const placeholders = [
  "Explain quantum entanglement step by step...",
  "Write a Next.js auth template with JWT...",
  "Help me structure my essay on climate change...",
  "Debug this React infinite re-render bug...",
  "Summarize the causes of the French Revolution...",
  "Generate a PRD for a task management SaaS...",
];

// Mode IDs must match backend SYSTEM_PROMPTS keys (lowercase, hyphenated)
const modes = [
  { id: "study", label: "Study", icon: BookOpen, desc: "Step-by-step tutor" },
  { id: "research", label: "Research", icon: Search, desc: "Deep analysis" },
  { id: "dev-tools", label: "Dev Tools", icon: Code2, desc: "PRDs & boilerplate" },
  { id: "vibe-coder", label: "Vibe Coder", icon: Zap, desc: "Cursor / v0 prompts" },
  { id: "notes", label: "Notes", icon: FileText, desc: "Flashcards" },
];

const features = [
  {
    title: "Instant Architecture",
    desc: "PRDs, TRDs, sitemaps, and starter code from a one-line description.",
    icon: Code2,
    link: "/dev-tools",
    cta: "Try Dev Co-Pilot",
  },
  {
    title: "Smart Flashcards",
    desc: "Paste your lecture notes and get an interactive flipcard deck in seconds.",
    icon: FileText,
    link: "/notes",
    cta: "Try Smart Notes",
  },
  {
    title: "Study Tutor",
    desc: "Step-by-step explanations with real-world analogies for any subject.",
    icon: BookOpen,
    link: "/study",
    cta: "Try Study Assistant",
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
    }, 3000);
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
      <div className="flex-1 overflow-y-auto relative">
        {/* Ambient glow */}
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-24 relative z-10 flex flex-col items-center">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-6 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Studylo — AI Study &amp; Dev Companion
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 tracking-tight font-serif leading-tight">
              Search smarter.<br />
              <span className="text-gradient">Learn deeper. Build faster.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Your AI command centre for intense study sessions, research, and shipping side projects.
            </p>
          </motion.div>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-2xl space-y-5"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-purple-600/20 rounded-2xl blur-xl group-hover:bg-purple-600/30 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex items-center border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
                <div className="pl-4 pr-2 text-purple-400">
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex-1 relative h-12 flex items-center">
                  <AnimatePresence mode="wait">
                    {!query && (
                      <motion.div
                        key={placeholderIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 flex items-center text-gray-500 pointer-events-none text-sm"
                      >
                        {placeholders[placeholderIndex]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-transparent focus:outline-none"
                    placeholder=" "
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim() || createConversation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center gap-1.5"
                >
                  {createConversation.isPending ? "Starting..." : "Ask"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mode chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  title={mode.desc}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeMode === mode.id
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-purple-400/40"
                      : "bg-[#111118] text-gray-400 border border-purple-500/10 hover:bg-[#1A1A24] hover:text-white hover:border-purple-500/30"
                  }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl mt-20"
          >
            {features.map((feature, i) => (
              <button
                key={i}
                onClick={() => setLocation(feature.link)}
                className="glass-card p-6 rounded-2xl border border-purple-500/10 hover:border-purple-500/40 transition-all group text-left hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold text-base mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{feature.desc}</p>
                <div className="flex items-center gap-1 text-purple-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  {feature.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
