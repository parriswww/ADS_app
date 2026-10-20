import { Camera, Layers, History } from "lucide-react";
import type { Tab } from "@/types";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-ald-border bg-ald-bg/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md">
        <NavButton
          active={active === "field"}
          onClick={() => onChange("field")}
          label="Field Capture"
          icon={<Camera className="h-[22px] w-[22px]" strokeWidth={active === "field" ? 2.4 : 1.8} />}
        />
        <NavButton
          active={active === "backlog"}
          onClick={() => onChange("backlog")}
          label="Backlog Scanner"
          icon={<Layers className="h-[22px] w-[22px]" strokeWidth={active === "backlog" ? 2.4 : 1.8} />}
        />
        <NavButton
          active={active === "history"}
          onClick={() => onChange("history")}
          label="History"
          icon={<History className="h-[22px] w-[22px]" strokeWidth={active === "history" ? 2.4 : 1.8} />}
        />
      </div>
    </nav>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function NavButton({ active, onClick, label, icon }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors ${
        active ? "text-ald-accent" : "text-ald-muted"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
          active ? "bg-ald-accent/15 scale-105" : "bg-transparent"
        }`}
      >
        {icon}
      </div>
      <span className="text-[11px] font-medium tracking-tight">{label}</span>
    </button>
  );
}
