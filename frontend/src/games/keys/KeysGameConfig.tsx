import type { GridSize, MaxGameSeconds } from "../core/types/GameConfig";

export type KeysGameConfig = {
  gridSize: GridSize;
  targetTeethCount: number;
  distractorTeethPool: number[];
  requiredMatches: number;
  rotationEnabled: boolean;
  mirroringEnabled: boolean;
  scaleVariation: number;
  maxGameSeconds: MaxGameSeconds;
};