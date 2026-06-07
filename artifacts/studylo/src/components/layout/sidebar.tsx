import { Link, useLocation } from "wouter";
import { MessageSquare, Code2, BookOpen, FileText, PlusCircle, Settings, Home, Wifi } from "lucide-react";
import { useListOpenaiConversations } from "@workspace/api-client-react";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, getInitials } from "@/hooks/use-settings";
import { StudyloMark } from "@/components/ui/studylo-logo";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const { settings } = useSettings();

  const initials = getInitials(settings.name);
  const displayName = settings.name || "Student";

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "New Conversation", mode: "study" } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setLocation(`/chat/${data.id}`);
        },
      }
    );
  };

  const navItems = [
    { icon: Home,     label: "Home",            href: "/" },
    { icon: Code2,    label: "Dev Tools",        href: "/dev-tools" },
    { icon: BookOpen, label: "Study Assistant",  href: "/study" },
    { icon: FileText, label: "Smart Notes",      href: "/notes" },
  ];

  const chatIcon = (mode: string | undefined) => {
    if (mode === "research")                      return <Wifi className="w-3 h-3 text-blue-400/70 flex-shrink-0" />;
    if (mode === "dev-tools" || mode === "vibe-coder") return <Code2 className="w-3 h-3 text-emerald-400/70 flex-shrink-0" />;
    return <MessageSquare className="w-3 h-3 text-gray-500 flex-shrink-0" />;
  };

  return (
    <div className="w-60 bg-[#080810] border-r border-white/[0.05] h-screen flex flex-col hidden md:flex select-none">

      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <StudyloMark size={30} />
        <span className="font-bold text-[17px] text-white tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
          Studylo
        </span>
      </div>

      <div className="h-px bg-white/[0.05] mx-3" />

      {/* New Chat */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/60 rounded-lg transition-all hover:text-white hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1]"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 pt-4 pb-1">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 px-2">Menu</p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                  active
                    ? "bg-white/[0.07] text-white font-medium"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                }`}>
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : ""}`} />
                  {item.label}
                  {active && <span className="ml-auto w-1 h-4 rounded-full bg-violet-500 opacity-70" />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-2 min-h-0">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 px-2">Recent</p>
        {isLoading ? (
          <div className="space-y-1.5 px-1">
            {[1,2,3].map(i => <Skeleton key={i} className="h-7 w-full bg-white/[0.04] rounded-lg" />)}
          </div>
        ) : conversations?.length === 0 ? (
          <p className="text-xs text-white/20 px-2 py-1">No chats yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations?.slice(0, 12).map((chat) => {
              const active = location === `/chat/${chat.id}`;
              return (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}>
                    {chatIcon(chat.mode)}
                    <span className="text-xs truncate">{chat.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="p-3 space-y-0.5 border-t border-white/[0.05]">
        <Link href="/settings">
          <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${
            location === "/settings"
              ? "bg-white/[0.07] text-white"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
          }`}>
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </Link>

        {/* User card */}
        <Link href="/settings">
          <div className="flex items-center gap-2.5 mt-1 px-2.5 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-all group border border-white/[0.05] hover:border-white/[0.09]">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 logo-glow">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{displayName}</p>
              <p className="text-white/30 text-[11px] capitalize truncate">{settings.studyLevel.replace(/-/g, " ")}</p>
            </div>
            <Settings className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
