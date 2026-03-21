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
  targetSwapChance: number;
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
  }));

  return {
    circles,
    targetId: targetIndex,
    swapsTotal: swapCount,
    swapsDone: 0,
    finished: false,
    targetSwapChance: 0.25,
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

export function pickSwapPair(circles: CircleItem[], state: GameState): SwapPair {
  const others = circles.filter(c => c.id !== state.targetId);
  const targetMoves = Math.random() < state.targetSwapChance;

  let a: number;
  if (targetMoves) {
    a = state.targetId;
  } else {
    a = others[getRandomInt(0, others.length - 1)].id;
  }

  const rest = circles.filter(c => c.id !== a);
  const b = rest[getRandomInt(0, rest.length - 1)].id;

  return { a, b };
}

export function applySwap(
  circles: CircleItem[],
  pair: SwapPair,
  state: GameState,
): { circles: CircleItem[]; newChance: number } {
  const targetMoved = pair.a === state.targetId || pair.b === state.targetId;

  const newCircles = circles.map(c => {
    if (c.id === pair.a) {
      const other = circles.find(o => o.id === pair.b)!;
      return { ...c, x: other.x, y: other.y };
    }
    if (c.id === pair.b) {
      const other = circles.find(o => o.id === pair.a)!;
      return { ...c, x: other.x, y: other.y };
    }
    return c;
  });

  return {
    circles: newCircles,
    newChance: targetMoved ? 0.25 : Math.min(state.targetSwapChance + 0.25, 1),
  };
}

export function evaluateGuess(state: GameState, guessedId: number): boolean {
  return guessedId === state.targetId;
}