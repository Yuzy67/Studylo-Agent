import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, BookOpen, Code2, Beaker, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";

const placeholders = [
  "Explain quantum entanglement...",
  "Write a Next.js auth template...",
  "Help me structure my essay...",
  "Debug this React component...",
  "Summarize the French Revolution..."
];

const modes = [
  { id: "Study", label: "Study", icon: BookOpen },
  { id: "Research", label: "Research", icon: Beaker },
  { id: "Dev Tools", label: "Dev Tools", icon: Code2 },
  { id: "Vibe Coder", label: "Vibe Coder", icon: TerminalSquare },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeMode, setActiveMode] = useState("Study");
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
    if (!query.trim()) return;

    createConversation.mutate({
      data: { title: query.slice(0, 30), mode: activeMode }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setLocation(`/chat/${data.id}?q=${encodeURIComponent(query)}`);
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto relative">
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Studylo Core v2.0
            </div>
            <h1 className="text-6xl font-extrabold text-white mb-6 tracking-tight font-serif">
              Search smarter.<br />
              <span className="text-gradient">Learn deeper. Build faster.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your AI command center for intense study sessions and deep work.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-2xl space-y-6"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-purple-600/20 rounded-2xl blur-xl group-hover:bg-purple-600/30 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex items-center">
                <div className="pl-4 pr-2 text-purple-400">
                  <Search className="w-6 h-6" />
                </div>
                <div className="flex-1 relative h-12 flex items-center">
                  <AnimatePresence mode="wait">
                    {!query && (
                      <motion.div
                        key={placeholderIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center text-gray-500 pointer-events-none text-lg font-medium"
                      >
                        {placeholders[placeholderIndex]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-lg font-medium focus:ring-0 placeholder:text-transparent"
                    placeholder=" "
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!query.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  Enter
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeMode === mode.id 
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-purple-400/50" 
                      : "bg-[#111118] text-gray-400 border border-purple-500/10 hover:bg-[#1A1A24] hover:text-white"
                  }`}
                >
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </button>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24"
          >
            {[
              { title: "Smart Generation", desc: "Auto-generate PRDs, prompts, and flashcards instantly.", icon: Sparkles },
              { title: "Deep Context", desc: "AI models fine-tuned specifically for academic and technical domains.", icon: BookOpen },
              { title: "Focus Mode", desc: "A distraction-free dark interface that feels like home.", icon: Code2 }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl border border-purple-500/10 hover:border-purple-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
