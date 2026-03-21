import { getRandomInt } from "../core/utils/random";
import type { KeysGameConfig } from "./KeysGameConfig";

export interface KeyBlueprint {
  id: string;
  teethCount: number;
  isTarget: boolean;
  visualMetadata: {
    rotation: number; // v radiánech
    isMirrored: boolean;
    scale: number;
  };
}

/**
 * Zamíchá pole prvků (Fisher-Yates shuffle).
 */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pomocná funkce pro vytvoření jednoho blueprintu.
 */
function createBlueprint(
  teeth: number,
  isTarget: boolean,
  config: KeysGameConfig,
  id: string
): KeyBlueprint {
  return {
    id,
    teethCount: teeth,
    isTarget,
    visualMetadata: {
      // Rotace 0-360 stupňů převedená na radiány, pokud je povolena
      rotation: config.rotationEnabled ? (getRandomInt(0, 359) * Math.PI) / 180 : 0,
      // Náhodné zrcadlení (50% šance), pokud je povoleno
      isMirrored: config.mirroringEnabled ? Math.random() > 0.5 : false,
      // Náhodné měřítko v rozsahu definovaném variací (např. 0.2 vytvoří rozsah 0.8 až 1.2)
      scale: 1 + (Math.random() * 2 - 1) * config.scaleVariation,
    },
  };
}

/**
 * Hlavní generátor herního kola.
 */
export function buildKeysRound(config: KeysGameConfig): KeyBlueprint[] {
  const blueprints: KeyBlueprint[] = [];
  const totalCells = config.gridSize * config.gridSize;

  // 1. Vygenerování cílových (správných) klíčů
  for (let i = 0; i < config.requiredMatches; i++) {
    blueprints.push(
      createBlueprint(config.targetTeethCount, true, config, `target_${i}`)
    );
  }

  // 2. Vyplnění zbytku gridu distraktory (špatnými odpověďmi)
  const remainingCount = totalCells - config.requiredMatches;
  for (let i = 0; i < remainingCount; i++) {
    const randomIndex = getRandomInt(0, config.distractorTeethPool.length - 1);
    const teeth = config.distractorTeethPool[randomIndex];
    blueprints.push(
      createBlueprint(teeth, false, config, `distractor_${i}`)
    );
  }

  // 3. Zamíchání, aby targety nebyly na začátku pole
  return shuffle(blueprints);
}