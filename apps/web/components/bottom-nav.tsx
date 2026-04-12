"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const accent = "#b45309";
const darkAccent = "#fbbf24";
const muted = "#78716c";

const pillActive = "bg-amber-200/55 backdrop-blur-md dark:bg-amber-900/30";

function IconHome({ active }: { active: boolean }) {
  const stroke = active ? accent : muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="dark:hidden">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-8H9v8H4a1 1 0 01-1-1v-9.5z" stroke={stroke} strokeWidth={active ? 2.25 : 1.5} strokeLinejoin="round" fill={active ? accent : "none"} fillOpacity={active ? 0.22 : 0} />
    </svg>
  );
}

function IconHomeDark({ active }: { active: boolean }) {
  const stroke = active ? darkAccent : muted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="hidden dark:block">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-8H9v8H4a1 1 0 01-1-1v-9.5z" stroke={stroke} strokeWidth={active ? 2.25 : 1.5} strokeLinejoin="round" fill={active ? darkAccent : "none"} fillOpacity={active ? 0.22 : 0} />
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  const stroke = active ? accent : muted;
  return (
    <>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="dark:hidden">
        <circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth={active ? 2.25 : 1.5} />
        <path d="M21 21l-4.35-4.35" stroke={stroke} strokeWidth={active ? 2.25 : 1.5} strokeLinecap="round" />
      </svg>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="hidden dark:block">
        <circle cx="11" cy="11" r="7" stroke={active ? darkAccent : muted} strokeWidth={active ? 2.25 : 1.5} />
        <path d="M21 21l-4.35-4.35" stroke={active ? darkAccent : muted} strokeWidth={active ? 2.25 : 1.5} strokeLinecap="round" />
      </svg>
    </>
  );
}

function IconWeekly({ active }: { active: boolean }) {
  const stroke = active ? accent : muted;
  return (
    <>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="dark:hidden">
        <rect x="5" y="4" width="14" height="16" rx="1.5" stroke={stroke} strokeWidth={active ? 2 : 1.5} fill="none" />
        <path d="M8 8h8M8 11h8M8 14h5" stroke={stroke} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      </svg>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="hidden dark:block">
        <rect x="5" y="4" width="14" height="16" rx="1.5" stroke={active ? darkAccent : muted} strokeWidth={active ? 2 : 1.5} fill="none" />
        <path d="M8 8h8M8 11h8M8 14h5" stroke={active ? darkAccent : muted} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      </svg>
    </>
  );
}

function IconForYou({ active }: { active: boolean }) {
  const stroke = active ? accent : muted;
  const w = active ? 2 : 1.5;
  return (
    <>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="dark:hidden">
        <rect x="6" y="11" width="12" height="9" rx="1.25" stroke={stroke} strokeWidth={w} />
        <rect x="7" y="7.5" width="12" height="9" rx="1.25" stroke={stroke} strokeWidth={w} />
        <rect x="8" y="4" width="12" height="9" rx="1.25" stroke={stroke} strokeWidth={w} />
      </svg>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="hidden dark:block">
        <rect x="6" y="11" width="12" height="9" rx="1.25" stroke={active ? darkAccent : muted} strokeWidth={w} />
        <rect x="7" y="7.5" width="12" height="9" rx="1.25" stroke={active ? darkAccent : muted} strokeWidth={w} />
        <rect x="8" y="4" width="12" height="9" rx="1.25" stroke={active ? darkAccent : muted} strokeWidth={w} />
      </svg>
    </>
  );
}

function IconSaved({ active }: { active: boolean }) {
  const stroke = active ? accent : muted;
  return (
    <>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? accent : "none"} fillOpacity={active ? 0.22 : 0} aria-hidden className="dark:hidden">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke={stroke} strokeWidth={active ? 2.25 : 1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? darkAccent : "none"} fillOpacity={active ? 0.22 : 0} aria-hidden className="hidden dark:block">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke={active ? darkAccent : muted} strokeWidth={active ? 2.25 : 1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </>
  );
}

function NavIcon({ type, active }: { type: string; active: boolean }) {
  switch (type) {
    case "home": return <><IconHome active={active} /><IconHomeDark active={active} /></>;
    case "search": return <IconSearch active={active} />;
    case "weekly": return <IconWeekly active={active} />;
    case "for-you": return <IconForYou active={active} />;
    case "saved": return <IconSaved active={active} />;
    default: return null;
  }
}

const navItems = [
  { href: "/" as const, label: "Home", icon: "home", homeTab: true as const, requiresAuth: false as const },
  { href: "/search" as const, label: "Search", icon: "search", homeTab: false as const, requiresAuth: false as const },
  { href: "/weekly" as const, label: "Weekly", icon: "weekly", homeTab: false as const, requiresAuth: false as const },
  { href: "/for-you" as const, label: "For you", icon: "for-you", homeTab: false as const, requiresAuth: true as const },
  { href: "/saved" as const, label: "Saved", icon: "saved", homeTab: false as const, requiresAuth: false as const }
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { user, loading } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (!item.requiresAuth) return true;
    return !loading && user !== null;
  });

  return (
    <nav
      className="glass-bottom-nav fixed bottom-0 left-0 right-0 z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl items-end justify-around px-2">
        {visibleItems.map(({ href, label, icon, homeTab }) => {
          const active = homeTab
            ? pathname === "/" || pathname.startsWith("/papers/")
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1"
            >
              <span
                className={`flex h-10 w-[3.25rem] items-center justify-center rounded-xl transition-colors duration-200 ${
                  active ? pillActive : "bg-transparent"
                }`}
              >
                <NavIcon type={icon} active={active} />
              </span>
              <span
                className={`truncate text-[10px] font-semibold tracking-wide ${
                  active ? "text-amber-700 dark:text-amber-400" : "text-stone-500 dark:text-stone-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
