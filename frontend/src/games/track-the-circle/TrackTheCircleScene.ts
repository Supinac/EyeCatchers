import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import { getGameSize } from "../pixi/PixiResize";
import { PixiTheme } from "../pixi/PixiTheme";
import { calculateBinaryScore } from "../core/utils/scoring";
import { delay } from "../core/utils/timers";
import {
  buildInitialState,
  pickSwapPair,
  applySwap,
  evaluateGuess,
  type GameState,
} from "./TrackTheCircleLogic";
import {
  HIGHLIGHT_DURATION_MS,
  SWAP_DURATION_MS,
  SWAP_PAUSE_MS,
} from "./TrackTheCircleConfig";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";

const CIRCLE_RADIUS = 48;
const SYMBOL_FONT_SIZE = 32;

// ── Kreslení symbolů ─────────────────────────────────────

function drawCircleRing(g: Graphics, color: number) {
  g.clear();
  g.lineStyle(3, color, 1);
  g.drawCircle(0, 0, CIRCLE_RADIUS);
}

function drawSymbol(symbolType: string, symbol: string, container: Container) {
  if (symbolType === "shape") {
    const g = new Graphics();
    g.beginFill(PixiTheme.foreground);
    if (symbol === "circle") {
      g.drawCircle(0, 0, 20);
    } else if (symbol === "square") {
      g.drawRect(-18, -18, 36, 36);
    } else if (symbol === "triangle") {
      g.moveTo(0, -20);
      g.lineTo(20, 18);
      g.lineTo(-20, 18);
      g.closePath();
    }
    g.endFill();
    container.addChild(g);
  } else {
    const t = new Text(symbol, new TextStyle({
      fill: PixiTheme.foreground,
      fontSize: SYMBOL_FONT_SIZE,
      fontFamily: "Arial",
      fontWeight: "bold",
    }));
    t.anchor.set(0.5);
    container.addChild(t);
  }
}

// ── Animace swap ─────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

async function animateSwap(
  spriteA: Container,
  spriteB: Container,
  toAx: number, toAy: number,
  toBx: number, toBy: number,
) {
  const fromAx = spriteA.x, fromAy = spriteA.y;
  const fromBx = spriteB.x, fromBy = spriteB.y;
  const steps = 30;
  const stepMs = SWAP_DURATION_MS / steps;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    spriteA.x = lerp(fromAx, toAx, t);
    spriteA.y = lerp(fromAy, toAy, t);
    spriteB.x = lerp(fromBx, toBx, t);
    spriteB.y = lerp(fromBy, toBy, t);
    await delay(stepMs);
  }
}

// ── Hlavní scéna ─────────────────────────────────────────

export function mountTrackTheCircleScene({
  mountElement,
  difficulty,
  swapCount,
  onComplete,
}: {
  mountElement: HTMLDivElement;
  difficulty: GameDifficulty;
  swapCount: number;
  onComplete: (result: GameResult) => void;
}) {
  const app = createPixiApp(mountElement);
  const { width, height } = getGameSize(mountElement);
  let destroyed = false;

  const root = new Container();
  app.stage.addChild(root);

  const state: GameState = buildInitialState(difficulty, swapCount);

  // Kontejnery pro každý kruh – klíčované podle id
  const sprites: Map<number, Container> = new Map();
  const rings: Map<number, Graphics> = new Map();

  // ── Vytvoření sprites ────────────────────────────────

  for (const circle of state.circles) {
    const container = new Container();
    container.x = circle.x * width;
    container.y = circle.y * height;

    const ring = new Graphics();
    drawCircleRing(ring, circle.isTarget ? 0xff3333 : PixiTheme.foreground);
    container.addChild(ring);

    drawSymbol(circle.symbolType, circle.symbol, container);

    root.addChild(container);
    sprites.set(circle.id, container);
    rings.set(circle.id, ring);
  }

  // ── Hlavní loop ──────────────────────────────────────

  async function run() {
    // Fáze 1 – zvýraznění cíle po dobu HIGHLIGHT_DURATION_MS
    await delay(HIGHLIGHT_DURATION_MS);
    if (destroyed) return;

    // Zbělednutí červeného kruhu
    const targetRing = rings.get(state.targetId)!;
    drawCircleRing(targetRing, PixiTheme.foreground);

    await delay(400);
    if (destroyed) return;

    // Fáze 2 – prohazování
    for (let i = 0; i < state.swapsTotal; i++) {
      if (destroyed) return;

      const pair = pickSwapPair(state.circles, state);
      const spriteA = sprites.get(pair.a)!;
      const spriteB = sprites.get(pair.b)!;

      const { circles: newCircles, newChance } = applySwap(state.circles, pair, state);
      const newA = newCircles.find(c => c.id === pair.a)!;
      const newB = newCircles.find(c => c.id === pair.b)!;

      await animateSwap(
        spriteA, spriteB,
        newA.x * width, newA.y * height,
        newB.x * width, newB.y * height,
      );

      // Aktualizace state po animaci
      state.circles = newCircles;
      state.targetSwapChance = newChance;

      await delay(SWAP_PAUSE_MS);
    }

    if (destroyed) return;

    // Fáze 3 – čekání na klik
    enableGuessing();
  }

  // ── Klikání ──────────────────────────────────────────

  function enableGuessing() {
    for (const circle of state.circles) {
      const container = sprites.get(circle.id)!;
      const ring = rings.get(circle.id)!;

      container.eventMode = "static";
      container.cursor = "pointer";
      container.hitArea = {
        contains: (x: number, y: number) =>
          Math.sqrt(x * x + y * y) <= CIRCLE_RADIUS,
      } as any;

      container.on("pointertap", () => {
        if (destroyed) return;
        disableGuessing();

        const correct = evaluateGuess(state, circle.id);
        const resultColor = correct ? 0x22c55e : 0xef4444;

        // Zvýraznění kliknutého
        drawCircleRing(ring, resultColor);

        // Pokud špatně – ukáže kde byl správný
        if (!correct) {
          const correctRing = rings.get(state.targetId)!;
          drawCircleRing(correctRing, 0x22c55e);
        }

        window.setTimeout(() => {
          if (destroyed) return;
          onComplete({
            gameKey: "track-the-circle",
            difficulty,
            score: calculateBinaryScore(correct),
            maxScore: 1,
            success: correct,
          });
        }, 1200);
      });
    }
  }

  function disableGuessing() {
    for (const circle of state.circles) {
      const container = sprites.get(circle.id)!;
      container.eventMode = "none";
    }
  }

  // ── Start ────────────────────────────────────────────
  run();

  // ── Cleanup ──────────────────────────────────────────
  return () => {
    destroyed = true;
    app.destroy(true, { children: true });
  };
}