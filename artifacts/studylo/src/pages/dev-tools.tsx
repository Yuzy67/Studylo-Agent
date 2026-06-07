import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useDevStream } from "@/hooks/use-stream";
import {
  Code2, FileCode2, Copy, Check, TerminalSquare,
  LayoutTemplate, Sparkles, AlertCircle, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const outputTypes = [
  { id: "prd",          label: "PRD",           icon: FileCode2,      desc: "Product Requirements" },
  { id: "trd",          label: "TRD",            icon: TerminalSquare, desc: "Technical Spec" },
  { id: "prompt",       label: "AI Prompt",      icon: Sparkles,       desc: "Cursor / v0 / Lovable" },
  { id: "sitemap",      label: "Sitemap",         icon: LayoutTemplate, desc: "Pages & routes" },
  { id: "starter-code", label: "Starter Code",   icon: Code2,          desc: "Boilerplate" },
  { id: "all",          label: "Full Blueprint",  icon: FileCode2,      desc: "Everything at once" },
];

const languages = [
  { id: "react",   label: "React / Vite" },
  { id: "nextjs",  label: "Next.js" },
  { id: "vue",     label: "Vue.js" },
  { id: "vanilla", label: "Vanilla JS" },
];

export default function DevTools() {
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLang, setSelectedLang] = useState("react");
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const { output, isStreaming, streamError, streamDevOutput } = useDevStream();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isStreaming) return;
    setShowOutput(true);
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5" style={{ fontFamily: "var(--app-font-serif)" }}>
              <Code2 className="w-6 h-6 md:w-7 md:h-7 text-violet-400 flex-shrink-0" />
              Dev Co-Pilot
            </h1>
            <p className="text-white/40 text-sm md:text-base mt-1">
              Describe your idea — get a PRD, TRD, sitemap, and starter code instantly.
            </p>
          </div>

          {/* Mobile: form on top, output below; Desktop: side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">

            {/* Form panel */}
            <div className="lg:col-span-1 space-y-5">
              <form onSubmit={handleGenerate} className="space-y-4">

                {/* Idea input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your Project Idea</label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. A SaaS app where students schedule study sessions with tutors, track progress, and get AI-generated quizzes…"
                    className="w-full h-28 md:h-36 glass-card rounded-xl p-4 text-white text-sm resize-none focus:outline-none placeholder:text-white/20 border border-white/[0.07] focus:border-violet-500/30 transition-colors"
                  />
                </div>

                {/* Output type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Output Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`flex flex-col items-start gap-0.5 p-3 rounded-xl text-xs transition-all border ${
                          selectedType === type.id
                            ? "bg-violet-600/15 border-violet-500/35 text-white"
                            : "bg-white/[0.03] border-white/[0.06] text-white/45 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <type.icon className="w-3.5 h-3.5" />
                          <span className="font-semibold">{type.label}</span>
                        </div>
                        <span className="text-white/30 text-[10px] leading-tight">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framework */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Framework</label>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLang(lang.id)}
                        className={`p-2.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedLang === lang.id
                            ? "bg-violet-600/15 border-violet-500/35 text-white"
                            : "bg-white/[0.03] border-white/[0.06] text-white/45 hover:bg-white/[0.06] hover:text-white"
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
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl clay-button transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isStreaming ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </form>
            </div>

            {/* Output panel */}
            <div className={`lg:col-span-2 ${!showOutput && !hasOutput ? "hidden lg:block" : ""}`}>
              <div className="glass-card rounded-2xl border border-white/[0.07] flex flex-col overflow-hidden" style={{ minHeight: "320px" }}>

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <TerminalSquare className="w-4 h-4 text-violet-400/60" />
                    <span className="font-mono">
                      {isStreaming ? "generating output…" : hasOutput ? "output ready" : "waiting for input"}
                    </span>
                    {isStreaming && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
                  </div>
                  {hasOutput && (
                    <button
                      onClick={copyOutput}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:text-white bg-white/[0.04] border border-white/[0.06] rounded-lg transition-colors"
                    >
                      {copied
                        ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy all</>}
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  {!hasOutput && !isStreaming && !streamError && (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3 py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/8 flex items-center justify-center">
                        <TerminalSquare className="w-7 h-7 text-violet-500/30" />
                      </div>
                      <p className="text-white/40 font-medium text-sm">Ready to generate</p>
                      <p className="text-xs text-white/20">Describe your project and click Generate</p>
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {["PRD", "TRD", "AI Prompt", "Sitemap", "Code", "Blueprint"].map((s) => (
                          <span key={s} className="text-[10px] px-2 py-1 rounded-md bg-violet-500/5 border border-violet-500/10 text-white/25">
                            {s}
                          </span>
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
                    <div className={`prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.08] prose-pre:text-xs prose-code:text-xs ${isStreaming ? "streaming-cursor" : ""}`}>
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
