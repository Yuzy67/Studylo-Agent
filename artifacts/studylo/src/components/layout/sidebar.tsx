import { StudyloMark } from "@/components/ui/studylo-logo";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  return (
    <div className="w-60 bg-[#080810] border-r border-white/[0.05] h-screen flex-col hidden md:flex select-none flex-shrink-0">
      {/* Logo — fixed height */}
      <div className="px-4 py-4 flex items-center gap-2.5 flex-shrink-0">
        <StudyloMark size={30} />
        <span className="font-bold text-[17px] text-white tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
          Studylo
        </span>
      </div>
      <div className="h-px bg-white/[0.05] mx-3 flex-shrink-0" />
      {/* Content fills remaining height — min-h-0 lets flex-1 shrink past content size */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <SidebarContent />
      </div>
    </div>
  );
}
