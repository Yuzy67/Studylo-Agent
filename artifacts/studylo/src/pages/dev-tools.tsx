import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useDevStream } from "@/hooks/use-stream";
import { Code2, FileCode2, Copy, Check, TerminalSquare, LayoutTemplate, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const outputTypes = [
  { id: "prd", label: "PRD", icon: FileCode2 },
  { id: "trd", label: "TRD", icon: TerminalSquare },
  { id: "prompt", label: "Prompt", icon: Sparkles },
  { id: "sitemap", label: "Sitemap", icon: LayoutTemplate },
  { id: "starter-code", label: "Starter Code", icon: Code2 },
  { id: "all", label: "All Docs", icon: FileCode2 }
];

const languages = ["react", "nextjs", "vue", "vanilla"];

export default function DevTools() {
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLang, setSelectedLang] = useState("react");
  const [activeTab, setActiveTab] = useState<string>("prd");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  
  const { outputs, isStreaming, streamDevOutput } = useDevStream();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isStreaming) return;
    
    await streamDevOutput(idea, selectedType, selectedLang);
    
    // Set first available tab active
    if (selectedType !== "all") {
      setActiveTab(selectedType);
    } else {
      setActiveTab("prd");
    }
  };

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const hasOutputs = Object.keys(outputs).length > 0;
  const availableTabs = Object.keys(outputs);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white font-serif flex items-center gap-3">
              <Code2 className="w-8 h-8 text-purple-500" />
              Dev Co-Pilot
            </h1>
            <p className="text-gray-400 text-lg">Generate complete project documentation and scaffolding instantly.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Project Idea</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-purple-600/10 rounded-xl blur-md transition-colors duration-500" />
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Describe your project idea in detail..."
                      className="w-full h-40 glass-card relative rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Output Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {outputTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all ${
                          selectedType === type.id 
                            ? 'bg-purple-600/20 border-purple-500/50 text-white' 
                            : 'bg-[#111118] border-purple-500/10 text-gray-400 hover:bg-[#1A1A24]'
                        } border`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Framework</label>
                  <select 
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full glass-card p-3 rounded-xl text-white appearance-none border-purple-500/20 focus:outline-none focus:border-purple-500/50"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang} className="bg-[#111118]">
                        {lang === 'react' ? 'React / Vite' : lang === 'nextjs' ? 'Next.js' : lang === 'vue' ? 'Vue.js' : 'Vanilla JS'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!idea.trim() || isStreaming}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStreaming ? "Generating..." : "Generate Architecture"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl border border-purple-500/20 h-[700px] flex flex-col overflow-hidden">
                {!hasOutputs && !isStreaming ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
                    <TerminalSquare className="w-12 h-12 text-purple-500/30" />
                    <p>Describe your idea to generate output</p>
                  </div>
                ) : (
                  <>
                    <div className="flex border-b border-purple-500/20 bg-[#0A0A0F]/50 overflow-x-auto">
                      {availableTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                            activeTab === tab 
                              ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' 
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 relative group">
                      {outputs[activeTab] && (
                        <button 
                          onClick={() => copyToClipboard(outputs[activeTab], activeTab)}
                          className="absolute top-6 right-6 p-2 bg-[#1A1A24] border border-purple-500/20 text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          {copiedTab === activeTab ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                      
                      <div className={`prose prose-invert max-w-none ${isStreaming && availableTabs[availableTabs.length-1] === activeTab ? 'streaming-cursor' : ''}`}>
                        <Markdown content={outputs[activeTab] || ''} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
