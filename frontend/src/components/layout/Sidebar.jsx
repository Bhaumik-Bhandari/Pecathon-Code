import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { NAVIGATION_LINKS } from "../../config/navigation";

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0b0e14]/75 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`sidebar-gradient-bg fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#d9cfc0]/15 text-white transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#D4AE6A]/35 bg-[#F4EBDD] p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.30)]">
              <img
                src="/images/Logo.jpeg"
                alt="Tsukuyomi Watch emblem"
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-xl object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="font-display truncate text-sm font-extrabold leading-tight tracking-[0.12em] text-[#F2E9DB]">
                TSUKUYOMI WATCH
              </p>
              <p className="mt-1 truncate text-xs font-medium tracking-wide text-[#C9A570]">
                Mystic Mikado Dojo
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thematic Navigation */}
        <nav
          aria-label="Main navigation"
          className="sidebar-nav-scroll flex-1 overflow-y-auto px-5 pt-7"
        >
          <section>
            <div className="space-y-2">
              {NAVIGATION_LINKS.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sakura-link group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-[15px] font-semibold whitespace-nowrap ${
                      isActive
                        ? "nav-link-active border-[#916344]/70 bg-gradient-to-r from-[#643A39] via-[#45323A] to-[#29313A] text-[#FFF0D7] shadow-[0_5px_20px_rgba(217,76,66,0.14)]"
                        : "border-transparent text-slate-300 hover:border-[#98674F]/70 hover:bg-gradient-to-r hover:from-[#663C3A]/90 hover:via-[#49313B]/75 hover:to-[#303641] hover:text-[#FFF0D7] hover:shadow-[0_5px_18px_rgba(217,76,66,0.12)]"
                    }`
                  }
                >
                  <span className="nav-link-glint" aria-hidden="true" />

                  <span className="sakura-sweep" aria-hidden="true">
                    {Array.from({ length: 18 }, (_, i) => (
                      <span
                        key={i}
                        className="nav-petal"
                        style={{
                          "--petal-top": `${8 + ((i * 17) % 84)}%`,
                          "--petal-delay": `${i * 35}ms`,
                          "--petal-size": `${6 + (i % 4) * 1.5}px`,
                          "--petal-drift": `${
                            (i % 2 === 0 ? -1 : 1) * (4 + (i % 5) * 2)
                          }px`,
                          "--petal-rotation": `${180 + i * 37}deg`,
                        }}
                      />
                    ))}
                  </span>

                  <Icon
                    size={20}
                    strokeWidth={1.9}
                    className="nav-link-content shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:text-[#F3BF76]"
                  />

                  <span className="nav-link-content flex-1 truncate">{label}</span>

                  <span className="nav-link-active-bar" aria-hidden="true" />
                </NavLink>
              ))}
            </div>
          </section>
        </nav>

        {/* Minimal footer */}
        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#C7AD91]">
            TSUKUYOMI WATCH
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Astronomical Sanctuary
          </p>
        </div>
      </aside>
    </>
  );
}
