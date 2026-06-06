import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useDevStream } from "@/hooks/use-stream";
import { Code2, FileCode2, Copy, Check, TerminalSquare, LayoutTemplate, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const outputTypes = [
  { id: "prd", label: "PRD", icon: FileCode2, desc: "Product Requirements" },
  { id: "trd", label: "TRD", icon: TerminalSquare, desc: "Technical Spec" },
  { id: "prompt", label: "AI Prompt", icon: Sparkles, desc: "For Cursor / v0 / Lovable" },
  { id: "sitemap", label: "Sitemap", icon: LayoutTemplate, desc: "Pages & routes" },
  { id: "starter-code", label: "Starter Code", icon: Code2, desc: "Boilerplate" },
  { id: "all", label: "Full Blueprint", icon: FileCode2, desc: "Everything at once" },
];

const languages = [
  { id: "react", label: "React / Vite" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue.js" },
  { id: "vanilla", label: "Vanilla JS" },
];

export default function DevTools() {
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLang, setSelectedLang] = useState("react");
  const [copied, setCopied] = useState(false);

  const { output, isStreaming, streamError, streamDevOutput } = useDevStream();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isStreaming) return;
    await streamDevOutput(idea, selectedType, selectedLang);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOutput = output.length > 0;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white font-serif flex items-center gap-3">
              <Code2 className="w-8 h-8 text-purple-500" />
              Dev Co-Pilot
            </h1>
            <p className="text-gray-400 text-lg mt-1">
              Describe your idea — get a PRD, TRD, AI prompt, sitemap, and starter code instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left panel */}
            <div className="lg:col-span-1 space-y-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Your Project Idea
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-purple-600/10 rounded-xl blur-md transition-colors duration-500 group-focus-within:bg-purple-600/20" />
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="e.g. A SaaS app where students can schedule study sessions with tutors, track progress, and get AI-generated quizzes..."
                      className="w-full h-36 glass-card relative rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-purple-500/50 placeholder:text-gray-600 border border-purple-500/10 focus:border-purple-500/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Output Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`flex flex-col items-start gap-0.5 p-3 rounded-xl text-xs transition-all border ${
                          selectedType === type.id
                            ? "bg-purple-600/20 border-purple-500/50 text-white shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                            : "bg-[#111118] border-purple-500/10 text-gray-400 hover:bg-[#1A1A24] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <type.icon className="w-3.5 h-3.5" />
                          <span className="font-semibold">{type.label}</span>
                        </div>
                        <span className="text-gray-500 text-[10px] leading-tight">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Framework
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLang(lang.id)}
                        className={`p-2.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedLang === lang.id
                            ? "bg-purple-600/20 border-purple-500/40 text-white"
                            : "bg-[#111118] border-purple-500/10 text-gray-400 hover:bg-[#1A1A24] hover:text-white"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!idea.trim() || isStreaming}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isStreaming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right panel - output */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl border border-purple-500/20 min-h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/20 bg-[#0A0A0F]/60">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <TerminalSquare className="w-4 h-4 text-purple-500" />
                    <span className="font-mono text-xs">
                      {isStreaming ? "generating output..." : hasOutput ? "output ready" : "waiting for input"}
                    </span>
                    {isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </div>
                  {hasOutput && (
                    <button
                      onClick={copyOutput}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#1A1A24] border border-purple-500/20 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy all</>
                      )}
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {!hasOutput && !isStreaming && !streamError && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 py-20">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <TerminalSquare className="w-8 h-8 text-purple-500/40" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-gray-400 font-medium">Ready to generate</p>
                        <p className="text-sm text-gray-600">Describe your project idea and choose an output type</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 max-w-sm w-full">
                        {["PRD", "TRD", "AI Prompt", "Sitemap", "Code", "Full Blueprint"].map((s) => (
                          <div key={s} className="text-[10px] text-center px-2 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10 text-gray-500">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {streamError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{streamError}</span>
                    </motion.div>
                  )}

                  {(hasOutput || isStreaming) && (
                    <div className={`prose prose-invert prose-sm max-w-none prose-pre:bg-[#111118] prose-pre:border prose-pre:border-purple-500/20 ${isStreaming ? "streaming-cursor" : ""}`}>
                      <Markdown content={output} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
