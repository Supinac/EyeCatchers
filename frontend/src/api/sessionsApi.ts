import { simulateDelay } from "./client";
import type { GameResult } from "../games/core/types/GameResult";

export async function saveSessionResult(result: GameResult): Promise<{ ok: true; id: string }> {
  console.log("Mock saveSessionResult", result);
  return simulateDelay({ ok: true, id: `session_${Date.now()}` }, 250);
}
