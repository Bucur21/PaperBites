"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  /** Topic chips / actions; when collapsed, only this row stays visible. */
  toolbar?: ReactNode;
  /** Pixels of vertical scroll before collapsing (default ~1–2 lines). */
  scrollThreshold?: number;
};

export function StickyScrollDashboard({
  eyebrow,
  title,
  description,
  toolbar,
  scrollThreshold = 56
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > scrollThreshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollThreshold]);

  return (
    <section
      className={`glass-dashboard sticky top-0 z-30 mb-10 flex flex-col rounded-2xl transition-[padding,gap] duration-200 ease-out ${
        collapsed ? "gap-3 px-5 py-3" : "gap-6 p-8"
      }`}
    >
      {!collapsed && (
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">{eyebrow}</p>
          <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-5xl">{title}</h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-600 dark:text-stone-400">{description}</p>
        </div>
      )}

      {collapsed && !toolbar ? (
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-400">{eyebrow}</p>
      ) : null}

      {toolbar ? <div className="flex flex-wrap gap-3">{toolbar}</div> : null}
    </section>
  );
}
