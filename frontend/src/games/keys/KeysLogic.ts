import { KeysGameConfig, KeyBlueprint } from './KeysGameConfig';

export function buildKeysRound(config: KeysGameConfig) {
  const runtimeTargetTeeth = Math.floor(Math.random() * 5) + 1;
  const distractorPool = [1, 2, 3, 4, 5].filter(t => t !== runtimeTargetTeeth);
  const totalCells = config.gridSize * config.gridSize;
  const safeRequiredMatches = Math.min(config.requiredMatches, totalCells - 1);

  const blueprints: KeyBlueprint[] = [];

  // 1. Správné klíče
  for (let i = 0; i < safeRequiredMatches; i++) {
    blueprints.push(createBlueprint(runtimeTargetTeeth, config, true));
  }

  // 2. Distraktory
  for (let i = safeRequiredMatches; i < totalCells; i++) {
    const randomDistractor = distractorPool[Math.floor(Math.random() * distractorPool.length)];
    blueprints.push(createBlueprint(randomDistractor, config, false));
  }

  // 3. Zamíchání
  for (let i = blueprints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blueprints[i], blueprints[j]] = [blueprints[j], blueprints[i]];
  }

  return { blueprints, runtimeTargetTeeth };
}

function createBlueprint(teethCount: number, config: KeysGameConfig, isTarget: boolean): KeyBlueprint {
  return {
    id: Math.random().toString(36).substring(2, 9),
    teethCount,
    isTarget,
    // Oprava: Vizuální šum musí být v objektu visualMetadata
    visualMetadata: {
      rotation: config.rotationEnabled ? Math.random() * Math.PI * 2 : 0,
      isMirrored: config.mirroringEnabled ? Math.random() > 0.5 : false,
      scale: 1 + (Math.random() * 2 - 1) * (config.scaleVariation || 0),
    }
  };
}

