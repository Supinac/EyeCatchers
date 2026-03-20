import { getSessionState, saveSessionState } from "../model/sessionStore";
import type { SessionState } from "../model/sessionTypes";

export function useGameSession() {
  return {
    getSessionState,
    saveSessionState: (value: SessionState) => saveSessionState(value),
  };
}
