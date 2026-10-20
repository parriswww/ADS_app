import { Settings, ScanLine, Sun, Moon } from "lucide-react";
import type { Theme } from "@/types";

interface TopBarProps {
  onOpenSettings: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function TopBar({ onOpenSettings, theme, onToggleTheme }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-ald-border bg-ald-bg/90 px-4 py-3 backdrop-blur-md"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/assets/logov2.png"
          alt="ADS logo"
          className="h-9 w-14 shrink-0 object-contain object-left"
        />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-ald-text">
            Alden Data Solutions
          </h1>
          <p className="text-[11px] font-medium text-ald-muted">Intake</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ald-muted transition-colors active:bg-ald-card hover:bg-ald-card hover:text-ald-text"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ald-muted transition-colors active:bg-ald-card hover:bg-ald-card hover:text-ald-text"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
