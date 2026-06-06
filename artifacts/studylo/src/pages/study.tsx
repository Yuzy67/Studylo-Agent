import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import { BookOpen, Calculator, Atom, FlaskConical, Code, Library, Globe, Send, Bot, Check, Copy, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";

const subjects = [
  { id: "Math", label: "Math", icon: Calculator },
  { id: "Physics", label: "Physics", icon: Atom },
  { id: "Chemistry", label: "Chemistry", icon: FlaskConical },
  { id: "Computer Science", label: "CS", icon: Code },
  { id: "Humanities", label: "Humanities", icon: Library },
  { id: "General", label: "General", icon: Globe },
];

type Message = { role: string; content: string; id: string };

export default function Study() {
  const [problem, setProblem] = useState("");
  const [activeSubject, setActiveSubject] = useState("Math");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createConversation = useCreateOpenaiConversation();
  const { streamingContent, isStreaming, streamError, streamMessage } = useChatStream();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || isStreaming) return;

    const userMessage = problem.trim();
    setProblem("");

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { role: "user", content: userMessage, id: userMsgId }]);

    let chatId = currentChatId;

    if (!chatId) {
      const conv = await createConversation.mutateAsync({
        data: {
          title: `${activeSubject}: ${userMessage.slice(0, 40)}`,
          mode: "study",
        },
      });
      chatId = conv.id;
      setCurrentChatId(chatId);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    const fullContent = await streamMessage(
      chatId,
      `Subject: ${activeSubject}\n\nProblem: ${userMessage}`,
      "study"
    );

    if (fullContent) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent, id: `assistant-${Date.now()}` },
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Subject selector header */}
        <div className="p-5 md:p-6 border-b border-purple-500/10 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-500" />
              Study Assistant
            </h1>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => setActiveSubject(subj.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeSubject === subj.id
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-purple-400/30"
                      : "bg-[#111118] text-gray-400 border border-purple-500/15 hover:bg-[#1A1A24] hover:text-white"
                  }`}
                >
                  <subj.icon className="w-3.5 h-3.5" />
                  {subj.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-36">
            {messages.length === 0 && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-purple-500/50" />
                </div>
                <div>
                  <p className="text-gray-300 font-semibold">Ready to help you learn</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Select a subject above and type your question or problem below
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-w-lg w-full">
                  {[
                    "Explain the chain rule in calculus",
                    "What is Newton's second law?",
                    "How does memoization work?",
                    "Summarize the causes of WW1",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setProblem(ex)}
                      className="text-left text-xs px-4 py-3 rounded-xl bg-[#111118] border border-purple-500/15 text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-[#1A1A24] transition-all"
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
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-[#1A1A24] text-gray-200 rounded-2xl px-5 py-3 border border-purple-500/10"
                        : "glass-card rounded-2xl px-7 py-5 border border-purple-500/20 shadow-[0_4px_20px_rgba(124,58,237,0.08)]"
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
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Live streaming */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass-card rounded-2xl px-7 py-5 max-w-[85%] w-full min-h-[80px] border border-purple-500/20">
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
              <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-xl group-hover:bg-purple-600/20 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex items-end border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={`Ask a ${activeSubject} question... (Enter to send)`}
                  className="w-full bg-transparent border-none text-white resize-none max-h-40 min-h-[48px] px-4 py-3 focus:ring-0 placeholder:text-gray-500 focus:outline-none leading-relaxed text-sm"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!problem.trim() || isStreaming}
                  className="mb-1 mr-1 flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,58,237,0.3)] text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:block">Solve</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
