import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Markdown } from "@/components/ui/markdown";
import { useGetOpenaiConversation, useListOpenaiMessages, getListOpenaiMessagesQueryKey } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-stream";
import { Send, Copy, RefreshCw, Bot, User, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: conversation, isLoading: isLoadingConv } = useGetOpenaiConversation(id, {
    query: { enabled: !!id }
  });
  
  const { data: messages, isLoading: isLoadingMsgs } = useListOpenaiMessages(id, {
    query: { enabled: !!id }
  });
  
  const { streamingContent, isStreaming, streamMessage } = useChatStream();
  
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    setInput("");
    
    await streamMessage(id, userMessage, conversation?.mode || "Study");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoadingConv || isLoadingMsgs) {
    return (
      <AppLayout>
        <div className="flex-1 p-6 flex flex-col gap-6">
          <Skeleton className="h-20 w-3/4 bg-purple-500/10" />
          <Skeleton className="h-32 w-full bg-purple-500/10" />
          <Skeleton className="h-24 w-2/3 bg-purple-500/10" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            <div className="text-center mb-12">
              <h1 className="text-2xl font-bold text-white font-serif">{conversation?.title}</h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mt-4 uppercase tracking-wider">
                {conversation?.mode || "Chat"} Mode
              </div>
            </div>

            {messages?.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                
                <div className={`relative group max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.15)]' 
                    : 'glass-card rounded-2xl rounded-tl-sm px-6 py-4'
                }`}>
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-[#111118] rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-purple-500/20"
                    >
                      {copiedId === msg.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <Markdown content={msg.content} />
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A24] border border-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
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
                <div className="glass-card rounded-2xl rounded-tl-sm px-6 py-4 max-w-[85%] w-full min-h-[60px]">
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
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-xl group-hover:bg-purple-600/20 transition-colors duration-500" />
              <div className="relative glass-card rounded-2xl p-2 flex items-end border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Studylo..."
                  className="w-full bg-transparent border-none text-white resize-none max-h-32 min-h-[44px] px-4 py-3 focus:ring-0 placeholder:text-gray-500 focus:outline-none"
                  rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="mb-1 mr-1 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
            <div className="text-center mt-2 text-xs text-gray-500">
              Studylo Core can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
