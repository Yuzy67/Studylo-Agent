import { StudyloMark } from "@/components/ui/studylo-logo";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  return (
    <div className="w-60 bg-[#080810] border-r border-white/[0.05] h-screen flex-col hidden md:flex select-none flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5 flex-shrink-0">
        <StudyloMark size={30} />
        <span className="font-bold text-[17px] text-white tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
          Studylo
        </span>
      </div>
      <div className="h-px bg-white/[0.05] mx-3 flex-shrink-0" />
      <SidebarContent />
    </div>
  );
}
