import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageNames = {
  "/watchtower": "Watchtower · Stargazing Atlas",
  "/spirit-lens": "Spirit Lens",
  "/celestial-scroll": "Celestial Scroll · Events Hub",
  "/skyview-radar": "SkyView Radar · Multi-Spectrum Telemetry",
};

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const activePage = pageNames[pathname] ?? "Watchtower · Stargazing Atlas";

  return (
    <div className="workspace-shell min-h-screen text-[#F2E9DB]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-h-screen md:pl-[280px]">
        <Topbar
          activePage={activePage}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
