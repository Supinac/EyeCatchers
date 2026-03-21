import type { RegisteredGame } from "../core/engine/GameRegistry";
import { mountKeysScene } from "./KeysScene";
import type { KeysGameConfig } from "./KeysGameConfig";

// Tvůj nezbytný fallback, aby to nespadlo, když config nepřijde z menu
const fallbackConfig: KeysGameConfig = {
  gridSize: 3, targetTeethCount: 2, distractorTeethPool: [1, 3, 4],
  requiredMatches: 2, rotationEnabled: true, mirroringEnabled: true,
  scaleVariation: 0, maxGameSeconds: 60
};

export const KeysGame: RegisteredGame = {
  key: "keys",
  render: ({ mountElement, config, onComplete }) => {
    return mountKeysScene(mountElement, (config?.keys as KeysGameConfig) || fallbackConfig);
  },
};