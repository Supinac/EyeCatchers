import { useEffect, useRef } from "react";
import { createGame } from "../core/engine/GameFactory";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";
import type { GameConfig } from "../core/types/GameConfig";

export function PixiGameHost({
  gameKey,
  difficulty,
  config,
  onComplete,
}: {
  gameKey: string;
  difficulty: GameDifficulty;
  config?: GameConfig;
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
      config,
      onComplete,
    });

    return () => {
      cleanup?.();
      if (hostRef.current) {
        hostRef.current.innerHTML = "";
      }
    };
  }, [config, difficulty, gameKey, onComplete]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 28,
        overflow: "hidden",
        background: "#000",
      }}
    />
  );
}
