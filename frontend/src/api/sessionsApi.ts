import type { GameResult } from "../games/core/types/GameResult";
import { recordGameForCurrentUser } from "../features/users/model/userStore";
import { simulateDelay } from "./client";

export async function saveSessionResult(result: GameResult): Promise<{ ok: true; id: string }> {
  recordGameForCurrentUser(result);
  return simulateDelay({ ok: true, id: `session_${Date.now()}` }, 250);
}
