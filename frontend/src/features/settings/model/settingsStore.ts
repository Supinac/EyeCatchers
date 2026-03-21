import type { SettingsState } from "./settingsTypes";

const STORAGE_KEY = "autism_game_settings";

export function saveSettingsState(value: SettingsState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getSettingsState(): SettingsState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SettingsState) : null;
}
