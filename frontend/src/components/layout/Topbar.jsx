import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Menu,
  MoonStar,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { NAVIGATION_LINKS } from "../../config/navigation";

function formatAlertTime(isoString) {
  if (!isoString) return "Just now";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Just now";
  }
}

export default function Topbar({ activePage, onMenuClick }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotifications();

  const [bellOpen, setBellOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const bellRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!bellRef.current?.contains(event.target)) {
        setBellOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setBellOpen(false);
        inputRef.current?.blur();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const match = NAVIGATION_LINKS.find((item) =>
      `${item.label} ${item.description} ${item.keywords}`
        .toLowerCase()
        .includes(q)
    );

    if (match) {
      navigate(match.to);
      setSearchQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-[88px] items-center justify-between gap-4 border-b border-[#d9cfc0]/15 px-4 sm:px-7 lg:px-10"
      style={{
        backgroundColor: "var(--dashboard-background-color)",
        backgroundImage: "var(--dashboard-background-image)",
      }}
    >
      {/* Left: mobile navigation and current page */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#B9B2A7] transition hover:bg-white/10 hover:text-[#F2E9DB] md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A570]">
            TSUKUYOMI WATCH
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-[#F2E9DB]">
            {activePage}
          </p>
        </div>
      </div>

      {/* Center: Clean search input (no dropdown popover) */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative mx-auto hidden w-full max-w-[540px] flex-1 md:block"
      >
        <div
          className={`relative flex h-[48px] items-center gap-3 rounded-xl border px-4 transition-all duration-200 ${
            searchFocused
              ? "border-[#C9A570]/60 bg-[#1B1B19] shadow-[0_0_0_3px_rgba(201,165,112,0.08)]"
              : "border-white/10 bg-black/25 hover:border-white/20"
          }`}
        >
          <Search
            size={17}
            className={`shrink-0 transition-colors ${
              searchFocused ? "text-[#E9B15D]" : "text-[#A9A196]"
            }`}
          />

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            placeholder="Jump to Watchtower, Spirit Lens, or Celestial Scroll..."
            aria-label="Search workspace and press Enter to navigate"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#F2E9DB] outline-none placeholder:text-[#827D73]"
          />

          {searchQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="text-xs font-medium text-[#A9A196] hover:text-white whitespace-nowrap"
            >
              Clear
            </button>
          ) : (
            <span className="hidden items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#A9A196] lg:flex">
              ⌘K
            </span>
          )}
        </div>
      </form>

      {/* Right: Functional Notification Bell */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label="Open sky notifications"
            aria-expanded={bellOpen}
            onClick={() => setBellOpen((open) => !open)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              bellOpen
                ? "border-[#E9B15D]/50 bg-[#E9B15D]/15 text-[#F2E9DB]"
                : "border-white/10 bg-white/[0.04] text-[#B9B2A7] hover:bg-white/10 hover:text-[#F2E9DB]"
            }`}
          >
            <Bell size={19} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-[#111315] bg-[#D94C42] px-1 font-mono text-[10px] font-bold tabular-nums text-white shadow-[0_0_10px_rgba(217,76,66,0.75)]">
                {unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              role="dialog"
              aria-label="Celestial alerts and notifications"
              className="profile-menu-enter absolute right-0 top-full z-50 mt-2.5 w-[340px] sm:w-[380px] overflow-hidden rounded-2xl border border-[#D4AE6A]/25 bg-[#12161F] shadow-[0_22px_60px_rgba(0,0,0,0.65)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-[#171C28] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <MoonStar size={16} className="text-[#E9B15D]" />
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#F2E9DB]">
                    Celestial Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="font-mono text-xs tabular-nums text-[#E9B15D]">
                      · {unreadCount} unread
                    </span>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C9A570] transition hover:text-[#F2E9DB] whitespace-nowrap"
                        title="Mark all as read"
                      >
                        <CheckCheck size={13} />
                        <span>Read all</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-rose-300 whitespace-nowrap"
                      title="Clear all notifications"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-[340px] divide-y divide-white/[0.06] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((alert) => (
                    <div
                      key={alert.id}
                      className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors ${
                        alert.read
                          ? "bg-transparent hover:bg-white/[0.03]"
                          : "bg-[#E9B15D]/[0.07] hover:bg-[#E9B15D]/[0.11]"
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E9B15D]/30 bg-[#E9B15D]/10 text-[#E9B15D]">
                        <MoonStar size={15} />
                      </div>

                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          markAsRead(alert.id);
                          setBellOpen(false);
                          if (alert.route) navigate(alert.route);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-[#C9A570]">
                            {alert.category}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-slate-400">
                            {formatAlertTime(alert.timestamp)}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs font-semibold text-[#F2E9DB]">
                          {alert.title}
                        </p>

                        {alert.message && (
                          <p className="mt-1 text-xs leading-5 text-[#A5B0BF]">
                            {alert.message}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1">
                        {!alert.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(alert.id)}
                            title="Mark as read"
                            className="rounded p-1 text-[#E9B15D] hover:bg-white/10"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNotification(alert.id)}
                          title="Dismiss alert"
                          className="rounded p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-slate-300"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-9 text-center">
                    <MoonStar
                      size={24}
                      className="mx-auto mb-2.5 text-[#C9A570]/60"
                    />
                    <p className="text-xs font-semibold text-[#F2E9DB]">
                      No active sky alerts
                    </p>
                    <p className="mt-1 text-xs text-[#8E99AB]">
                      Open the Celestial Scroll to trigger lunar rise and
                      cosmic event notifications.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-[#0E121A] px-4 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/celestial-scroll");
                  }}
                  className="text-xs font-semibold text-[#E9B15D] transition hover:text-[#FFE2A8]"
                >
                  Open Celestial Scroll →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
