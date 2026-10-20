import { useCallback, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ToastContainer } from "@/components/ToastContainer";
import { SettingsModal } from "@/components/SettingsModal";
import { FieldCapture } from "@/components/FieldCapture";
import { BacklogScanner } from "@/components/BacklogScanner";
import { SessionHistory } from "@/components/SessionHistory";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/useToast";
import { useAldenSender } from "@/hooks/useAldenSender";
import { useTheme } from "@/hooks/useTheme";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import type { Tab, AldenPayload, HistoryEntry } from "@/types";
import { generateId } from "@/utils/media";

function App() {
  const [tab, setTab] = useState<Tab>("field");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { toasts, showToast, updateToast, dismiss } = useToast();
  const { send } = useAldenSender();
  const { theme, toggleTheme } = useTheme();
  const { history, addEntry, clearHistory } = useSessionHistory();

  const handleSend = useCallback(
    async (payload: AldenPayload) => {
      const result = await send({
        webhookUrl: settings.webhookUrl,
        fallbackWebhookUrl: settings.fallbackWebhookUrl,
        payload,
      });

      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: payload.timestamp,
        mode: payload.mode,
        status: result.ok ? "success" : "error",
        imageCount: payload.images.length,
        dictationPreview: payload.dictation_text.slice(0, 80),
        error: result.ok ? undefined : result.error,
      };
      addEntry(entry);

      return result;
    },
    [send, settings.webhookUrl, settings.fallbackWebhookUrl, addEntry]
  );

  return (
    <div className="flex min-h-screen flex-col bg-ald-bg">
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main
        className="mx-auto w-full max-w-md flex-1 pb-24"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
      >
        {tab === "field" ? (
          <FieldCapture onSend={handleSend} showToast={showToast} updateToast={updateToast} />
        ) : tab === "backlog" ? (
          <BacklogScanner onSend={handleSend} showToast={showToast} updateToast={updateToast} />
        ) : (
          <SessionHistory history={history} onClear={clearHistory} />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onSave={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;
