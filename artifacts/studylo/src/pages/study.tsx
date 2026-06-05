import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import { BookOpen, Calculator, Atom, FlaskConical, Code, Library, Send, Bot, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";

const subjects = [
  { id: "Math", icon: Calculator },
  { id: "Physics", icon: Atom },
  { id: "Chemistry", icon: FlaskConical },
  { id: "CS", icon: Code },
  { id: "Humanities", icon: Library }
];

export default function Study() {
  const [problem, setProblem] = useState("");
  const [activeSubject, setActiveSubject] = useState("Math");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const createConversation = useCreateOpenaiConversation();
  const { streamingContent, isStreaming, streamMessage } = useChatStream();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<{role: string, content: string}[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || isStreaming) return;
    
    const userMessage = problem.trim();
    setProblem("");
    
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    
    let chatId = currentChatId;
    
    if (!chatId) {
      const conv = await createConversation.mutateAsync({
        data: { title: `Study: ${activeSubject} - ${userMessage.slice(0, 20)}...`, mode: "Study" }
      });
      chatId = conv.id;
      setCurrentChatId(conv.id);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }
    
    await streamMessage(chatId, `Context: ${activeSubject}\n\nProblem: ${userMessage}`, "Study");
    
    // Note: In a real app we'd fetch messages from API to update history,
    // but for simplicity here we just append the streamed content when done
    setHistory(prev => [...prev, { role: 'assistant', content: streamingContent }]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 md:p-8 border-b border-purple-500/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white font-serif flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-500" />
              Study Assistant
            </h1>
            
            <div className="flex flex-wrap gap-3">
              {subjects.map(subj => (
                <button
                  key={subj.id}
                  onClick={() => setActiveSubject(subj.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeSubject === subj.id
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] border-transparent"
                      : "bg-[#111118] text-gray-400 border border-purple-500/20 hover:bg-[#1A1A24]"
                  }`}
                >
                  <subj.icon className="w-4 h-4" />
                  {subj.id}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {history.length === 0 && !isStreaming ? (
              <div className="h-40 flex items-center justify-center text-gray-500 border border-dashed border-purple-500/20 rounded-2xl mt-10">
                <p>Select a subject and paste your problem below to get a step-by-step solution.</p>
              </div>
            ) : null}

            {history.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                
                <div className={`relative group max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-[#1A1A24] text-gray-300 rounded-2xl px-5 py-3 border border-purple-500/10' 
                    : 'glass-card rounded-2xl px-8 py-6 border-purple-500/30 shadow-[0_8px_30px_rgba(124,58,237,0.1)]'
                }`}>
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-[#111118] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-purple-500/20"
                    >
                      {copiedId === msg.content ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <Markdown content={msg.content} />
                  )}
                </div>
              </motion.div>
            ))}

            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass-card rounded-2xl px-8 py-6 max-w-[85%] w-full min-h-[100px] border-purple-500/40 shadow-[0_8px_30px_rgba(124,58,237,0.15)]">
                  <div className={`prose prose-invert max-w-none prose-p:leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
                    <Markdown content={streamingContent} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-xl group-hover:bg-purple-600/20 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex flex-col border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Paste your problem here..."
                  className="w-full bg-transparent border-none text-white resize-none max-h-48 min-h-[80px] px-4 py-3 focus:ring-0 placeholder:text-gray-500 focus:outline-none"
                />
                <div className="flex justify-end p-2 border-t border-purple-500/10 mt-2">
                  <button
                    type="submit"
                    disabled={!problem.trim() || isStreaming}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  >
                    <span>Solve</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
