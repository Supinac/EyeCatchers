import { useEffect, useState } from "react";
import { getSettings, updateSettings, type AppSettings } from "../../../api/settingsApi";
import { getSettingsState, saveSettingsState } from "../model/settingsStore";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(
    getSettingsState() ?? {
      soundEnabled: false,
      animationLevel: "none",
    },
  );

  useEffect(() => {
    getSettings().then((apiSettings) => {
      setSettings(apiSettings);
      saveSettingsState(apiSettings);
    });
  }, []);

  async function save(next: AppSettings) {
    const saved = await updateSettings(next);
    setSettings(saved);
    saveSettingsState(saved);
  }

  return { settings, save };
}
