import { Link, useLocation } from "wouter";
import { MessageSquare, Code2, BookOpen, FileText, PlusCircle, Settings, Home, Wifi } from "lucide-react";
import { useListOpenaiConversations } from "@workspace/api-client-react";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, getInitials } from "@/hooks/use-settings";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const { settings } = useSettings();

  const initials = getInitials(settings.name);
  const displayName = settings.name || "Student";

  const handleNewChat = () => {
    createConversation.mutate({
      data: { title: "New Conversation", mode: "study" }
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

  const modeIcon = (mode: string | undefined) => {
    if (mode === "research") return <Wifi className="w-3 h-3 text-blue-400 flex-shrink-0" />;
    if (mode === "dev-tools" || mode === "vibe-coder") return <Code2 className="w-3 h-3 text-green-400 flex-shrink-0" />;
    return <MessageSquare className="w-3 h-3 flex-shrink-0" />;
  };

  return (
    <div className="w-64 bg-[#0A0A0F] border-r border-purple-500/10 h-screen flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-purple-500/10">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center purple-glow">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <span className="font-bold text-lg text-white font-serif">Studylo</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg transition-colors border border-purple-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-medium text-sm">New Chat</span>
        </button>
      </div>

      {/* Nav */}
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

        {/* Recent Chats */}
        <div className="mt-5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Chats</div>
        {isLoading ? (
          <div className="space-y-2 px-2">
            <Skeleton className="h-8 w-full bg-[#111118]" />
            <Skeleton className="h-8 w-full bg-[#111118]" />
            <Skeleton className="h-8 w-full bg-[#111118]" />
          </div>
        ) : conversations?.length === 0 ? (
          <p className="text-xs text-gray-600 px-3 py-2">No chats yet — start one above!</p>
        ) : (
          conversations?.slice(0, 10).map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${location === `/chat/${chat.id}` ? 'bg-[#111118] text-white border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-[#111118]/50'}`}>
                {modeIcon(chat.mode)}
                <span className="text-sm font-medium truncate">{chat.title}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Bottom — Settings + User profile */}
      <div className="p-3 border-t border-purple-500/10 space-y-1">
        <Link href="/settings">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${location === "/settings" ? "bg-[#111118] text-white border border-purple-500/20" : "text-gray-400 hover:text-white hover:bg-[#111118]"}`}>
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </Link>

        {/* User profile card */}
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 bg-[#111118] border border-purple-500/10 cursor-pointer hover:border-purple-500/25 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 purple-glow">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{displayName}</p>
              <p className="text-gray-500 text-xs capitalize truncate">{settings.studyLevel.replace("-", " ")}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
