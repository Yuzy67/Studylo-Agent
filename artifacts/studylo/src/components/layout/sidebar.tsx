import { Link, useLocation } from "wouter";
import { MessageSquare, Code2, BookOpen, FileText, PlusCircle, Settings, Home } from "lucide-react";
import { useListOpenaiConversations } from "@workspace/api-client-react";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();

  const handleNewChat = () => {
    createConversation.mutate({
      data: { title: "New Conversation", mode: "Study" }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setLocation(`/chat/${data.id}`);
      }
    });
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Code2, label: "Dev Tools", href: "/dev-tools" },
    { icon: BookOpen, label: "Study Assistant", href: "/study" },
    { icon: FileText, label: "Smart Notes", href: "/notes" },
  ];

  return (
    <div className="w-64 bg-[#0A0A0F] border-r border-purple-500/10 h-screen flex flex-col hidden md:flex">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center purple-glow">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-lg text-white font-serif">Studylo</span>
        </div>
      </div>

      <div className="px-3 py-4">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg transition-colors border border-purple-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-medium text-sm">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Navigation</div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${location === item.href ? 'bg-[#111118] text-white border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-[#111118]/50'}`}>
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </Link>
        ))}

        <div className="mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Chats</div>
        {isLoading ? (
          <div className="space-y-2 px-2">
            <Skeleton className="h-8 w-full bg-[#111118]" />
            <Skeleton className="h-8 w-full bg-[#111118]" />
            <Skeleton className="h-8 w-full bg-[#111118]" />
          </div>
        ) : (
          conversations?.slice(0, 10).map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${location === `/chat/${chat.id}` ? 'bg-[#111118] text-white border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-[#111118]/50'}`}>
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{chat.title}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="p-4 border-t border-purple-500/10">
        <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#111118] rounded-lg cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </div>
      </div>
    </div>
  );
}
