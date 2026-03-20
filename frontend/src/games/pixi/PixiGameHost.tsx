import { useEffect, useRef } from "react";
import { createGame } from "../core/engine/GameFactory";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";

export function PixiGameHost({
  gameKey,
  difficulty,
  onComplete,
}: {
  gameKey: string;
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const game = createGame(gameKey);
    if (!game) return;

    const cleanup = game.render({
      mountElement: hostRef.current,
      difficulty,
      onComplete,
    });

    return cleanup;
  }, [gameKey, difficulty, onComplete]);

  return <div ref={hostRef} style={{ width: "100%", minHeight: 540 }} />;
}
