import { Menu, X } from "lucide-react";
import { StudyloMark } from "@/components/ui/studylo-logo";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-[#080810]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <button
        onClick={onMenuOpen}
        className="p-2 -ml-1 text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <StudyloMark size={26} />
        <span className="font-bold text-[16px] text-white tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
          Studylo
        </span>
      </div>
    </header>
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#080810] border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <StudyloMark size={26} />
            <span className="font-bold text-[16px] text-white tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
              Studylo
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
