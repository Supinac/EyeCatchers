import type { GridSize, MaxGameSeconds } from "../core/types/GameConfig";

export type KeyBlueprint = {
  id: string;
  teethCount: number;
  isTarget: boolean;
  visualMetadata: {
    rotation: number;
    isMirrored: boolean;
    scale: number;
  };
};

// PŘIDAT "export" PŘED TYPE
export type KeysGameConfig = {
  gridSize: GridSize;
  requiredMatches: number;
  rotationEnabled: boolean;
  mirroringEnabled: boolean;
  scaleVariation: number;
  maxGameSeconds: MaxGameSeconds;
  distractorTeethPool: number[];
};