import { Link, useLocation } from "wouter";
import { Home, BookOpen, Code2, FileText, Settings } from "lucide-react";

const tabs = [
  { href: "/",           icon: Home,     label: "Home" },
  { href: "/study",      icon: BookOpen, label: "Study" },
  { href: "/dev-tools",  icon: Code2,    label: "Dev" },
  { href: "/notes",      icon: FileText, label: "Notes" },
  { href: "/settings",   icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-[#080810]/95 backdrop-blur-xl border-t border-white/[0.07] pb-safe">
      {tabs.map((tab) => {
        const active = location === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className="flex-1">
            <div className={`flex flex-col items-center gap-1 py-2.5 transition-all ${active ? "text-violet-400" : "text-white/35 hover:text-white/60"}`}>
              <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-violet-500/15" : ""}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-violet-400" : "text-white/30"}`}>
                {tab.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
