import type { SessionState } from "./sessionTypes";

const STORAGE_KEY = "autism_game_session";

export function saveSessionState(value: SessionState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getSessionState(): SessionState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SessionState) : null;
}
