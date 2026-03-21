import { getRandomInt } from "../core/utils/random";
import { getTrackConfig, SYMBOL_POOL, SYMBOL_TYPES, type SymbolType } from "./TrackTheCircleConfig";
import type { GameDifficulty } from "../core/types/GameDefinition";

export type CircleItem = {
  id: number;
  symbol: string;
  symbolType: SymbolType;
  isTarget: boolean;
  x: number;
  y: number;
  swapWeight: number; // ← nové
};

export type SwapPair = {
  a: number;
  b: number;
};

export type GameState = {
  circles: CircleItem[];
  targetId: number;
  swapsTotal: number;
  swapsDone: number;
  finished: boolean;
};

export function buildInitialState(
  difficulty: GameDifficulty,
  swapCount: number,
): GameState {
  const config = getTrackConfig(difficulty);
  const symbolType = SYMBOL_TYPES[getRandomInt(0, SYMBOL_TYPES.length - 1)];
  const pool = SYMBOL_POOL[symbolType];
  const symbol = pool[getRandomInt(0, pool.length - 1)];

  const positions = generatePositions(config.circleCount);
  const targetIndex = getRandomInt(0, config.circleCount - 1);

  const circles: CircleItem[] = positions.map((pos, i) => ({
    id: i,
    symbol,
    symbolType,
    isTarget: i === targetIndex,
    x: pos.x,
    y: pos.y,
    swapWeight: 1,
  }));

  return {
    circles,
    targetId: targetIndex,
    swapsTotal: swapCount,
    swapsDone: 0,
    finished: false,
  };
}

export function generatePositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const margin = 0.15;
  const usable = 1 - margin * 2;

  if (count <= 4) {
    for (let i = 0; i < count; i++) {
      positions.push({
        x: margin + (usable / (count - 1 || 1)) * i,
        y: 0.5,
      });
    }
  } else {
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.push({
        x: 0.5 + 0.35 * Math.cos(angle),
        y: 0.5 + 0.35 * Math.sin(angle),
      });
    }
  }

  return positions;
}

function weightedPickTwo(circles: CircleItem[]): SwapPair {
  // Výběr prvního podle váhy
  const totalWeight = circles.reduce((sum, c) => sum + c.swapWeight, 0);
  let r = Math.random() * totalWeight;
  let a = circles[circles.length - 1].id;
  for (const c of circles) {
    r -= c.swapWeight;
    if (r <= 0) { a = c.id; break; }
  }

  // Výběr druhého – ze zbytku, také weighted
  const rest = circles.filter(c => c.id !== a);
  const totalRest = rest.reduce((sum, c) => sum + c.swapWeight, 0);
  let r2 = Math.random() * totalRest;
  let b = rest[rest.length - 1].id;
  for (const c of rest) {
    r2 -= c.swapWeight;
    if (r2 <= 0) { b = c.id; break; }
  }

  return { a, b };
}

export function pickSwapPair(circles: CircleItem[]): SwapPair {
  return weightedPickTwo(circles);
}

export function applySwap(circles: CircleItem[], pair: SwapPair): CircleItem[] {
  const movedIds = new Set([pair.a, pair.b]);

  return circles.map(c => {
    if (c.id === pair.a) {
      const other = circles.find(o => o.id === pair.b)!;
      return { ...c, x: other.x, y: other.y, swapWeight: 1 }; // reset váhy
    }
    if (c.id === pair.b) {
      const other = circles.find(o => o.id === pair.a)!;
      return { ...c, x: other.x, y: other.y, swapWeight: 1 }; // reset váhy
    }
    // Nehýbal se – zvýšení váhy o 25 %
    return { ...c, swapWeight: c.swapWeight + 0.25 };
  });
}

export function evaluateGuess(state: GameState, guessedId: number): boolean {
  return guessedId === state.targetId;
}