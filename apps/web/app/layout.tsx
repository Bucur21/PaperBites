import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppProviders } from "../components/app-providers";
import { AuthBar } from "../components/auth-bar";
import { BottomNav } from "../components/bottom-nav";
import { ThemeToggle } from "../components/theme-toggle";

export const metadata: Metadata = {
  title: "PaperBites",
  description: "The fastest way to stay current in your field."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("paperbites-theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`
          }}
        />
      </head>
      <body className="bg-[#fffdf7] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <AppProviders>
          <div className="pointer-events-none fixed left-4 right-4 top-4 z-50 flex items-start justify-between gap-3">
            <div className="pointer-events-auto min-w-0 flex-1">
              <AuthBar />
            </div>
            <div className="pointer-events-auto shrink-0">
              <ThemeToggle />
            </div>
          </div>
          <div className="min-h-screen pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">{children}</div>
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
