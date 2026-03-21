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
    if (!game) {
      hostRef.current.innerHTML = `<div style="padding:24px;color:white">Game not found: ${gameKey}</div>`;
      return;
    }

    const cleanup = game.render({
      mountElement: hostRef.current,
      difficulty,
      onComplete,
    });

    return () => {
      cleanup?.();
      if (hostRef.current) {
        hostRef.current.innerHTML = "";
      }
    };
  }, [gameKey, difficulty, onComplete]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        minHeight: 540,
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 24,
        overflow: "hidden",
        background: "#000",
      }}
    />
  );
}
