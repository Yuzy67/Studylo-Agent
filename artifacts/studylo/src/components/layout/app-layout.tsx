import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileHeader, MobileDrawer } from "./mobile-header";
import { MobileNav } from "./mobile-nav";
import { SidebarContent } from "./sidebar-content";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#080810] text-white overflow-hidden font-sans">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top header */}
      <MobileHeader onMenuOpen={() => setMobileOpen(true)} />

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </MobileDrawer>

      {/* Main content — push down on mobile for header, up for bottom nav */}
      <main className="flex-1 flex flex-col min-w-0 relative pt-14 pb-[64px] md:pt-0 md:pb-0 overflow-hidden">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <MobileNav />
    </div>
  );
}
