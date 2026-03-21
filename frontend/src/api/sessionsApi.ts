import type { GameResult } from "../games/core/types/GameResult";
import { recordGameForCurrentUser } from "../features/users/model/userStore";
import { buildSubmitScoreRequest, submitScore } from "./resultsApi";

export async function saveSessionResult(result: GameResult): Promise<{ ok: true; id: string }> {
  const localId = `session_${Date.now()}`;

  recordGameForCurrentUser(result);

  try {
    const response = await submitScore(buildSubmitScoreRequest(result));

    return {
      ok: true,
      id: typeof response === "string" && response.trim() ? response : localId,
    };
  } catch (error) {
    console.warn("Failed to submit result to /user/results. Keeping local session only.", error);

    return {
      ok: true,
      id: localId,
    };
  }
}
