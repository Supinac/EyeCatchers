import { mountFindCircleScene } from "./FindCircleScene";
import type { RegisteredGame } from "../core/engine/GameRegistry";

export const FindCircleGame: RegisteredGame = {
  key: "find-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    let cleanup: (() => void) | undefined;

    void mountFindCircleScene({ mountElement, difficulty, onComplete }).then((destroy) => {
      cleanup = destroy;
    });

    return () => {
      cleanup?.();
    };
  },
};
