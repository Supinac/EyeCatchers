import { Container, Graphics, Point, Rectangle, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import { getGameSize } from "../pixi/PixiResize";
import { buildFindCircleRound, type FindCircleItem, type ShapeKind } from "./FindCircleLogic";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";
import type { FindCircleGameConfig } from "../core/types/GameConfig";

const COLORS = {
  white: 0xffffff,
  muted: 0x9f9f9f,
  panel: 0x060606,
  panelBorder: 0x2a2a2a,
  correct: 0x22c55e,
  wrong: 0xef4444,
};

function getRounded(value: number) {
  return Math.round(value);
}

function drawShape(graphic: Graphics, kind: ShapeKind, size: number, color: number) {
  graphic.clear();
  graphic.beginFill(color, 1);

  const roundedSize = Math.max(24, getRounded(size));
  const half = roundedSize / 2;

  if (kind === "circle") {
    graphic.drawCircle(0, 0, half);
    graphic.endFill();
    return;
  }

  if (kind === "square") {
    const rectWidth = getRounded(roundedSize * 1.12);
    const rectHeight = getRounded(roundedSize * 0.76);
    graphic.drawRoundedRect(
      -rectWidth / 2,
      -rectHeight / 2,
      rectWidth,
      rectHeight,
      Math.max(10, Math.round(rectHeight * 0.22)),
    );
    graphic.endFill();
    return;
  }

  if (kind === "triangle") {
    const points = [
      new Point(0, -half),
      new Point(half, half),
      new Point(-half, half),
    ];
    graphic.drawPolygon(points);
    graphic.endFill();
    return;
  }

  if (kind === "diamond") {
    const points = [
      new Point(0, -half),
      new Point(half, 0),
      new Point(0, half),
      new Point(-half, 0),
    ];
    graphic.drawPolygon(points);
    graphic.endFill();
    return;
  }

  const outerRadius = half;
  const innerRadius = roundedSize / 4.4;
  const points: Point[] = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    points.push(new Point(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  graphic.drawPolygon(points);
  graphic.endFill();
}

function drawCard(graphic: Graphics, size: number, borderColor: number) {
  graphic.clear();
  graphic.beginFill(COLORS.panel, 1);
  graphic.lineStyle(3, borderColor, 1);
  graphic.drawRoundedRect(-size / 2, -size / 2, size, size, Math.max(18, size * 0.14));
  graphic.endFill();
}

function makeCounterLabel(text: string) {
  return new Text(
    text,
    new TextStyle({
      fill: "#ffffff",
      fontSize: 18,
      fontFamily: "Arial",
      fontWeight: "700",
    }),
  );
}

function createGridItem({
  item,
  cellSize,
  canInteract,
  onTap,
}: {
  item: FindCircleItem;
  cellSize: number;
  canInteract: () => boolean;
  onTap: (item: FindCircleItem, updateState: (state: "correct" | "wrong") => void) => void;
}) {
  const container = new Container();
  const card = new Graphics();
  const symbol = new Graphics();
  const symbolSize = cellSize * 0.38 * item.scale;

  function paint(state: "idle" | "correct" | "wrong") {
    const borderColor = state === "correct" ? COLORS.correct : state === "wrong" ? COLORS.wrong : COLORS.panelBorder;
    const symbolColor = state === "correct" ? COLORS.correct : state === "wrong" ? COLORS.wrong : COLORS.white;

    drawCard(card, cellSize, borderColor);
    drawShape(symbol, item.kind, symbolSize, symbolColor);
  }

  paint("idle");
  container.addChild(card, symbol);
  container.eventMode = "static";
  container.cursor = "pointer";
  container.hitArea = new Rectangle(-cellSize / 2, -cellSize / 2, cellSize, cellSize);

  let locked = false;

  container.on("pointertap", () => {
    if (locked || !canInteract()) return;

    onTap(item, (state) => {
      locked = true;
      paint(state);
      container.cursor = "default";
    });
  });

  return container;
}

export function mountFindCircleScene({
  mountElement,
  difficulty,
  config,
  onComplete,
}: {
  mountElement: HTMLDivElement;
  difficulty: GameDifficulty;
  config: FindCircleGameConfig;
  onComplete: (result: GameResult) => void;
}) {
  const app = createPixiApp(mountElement);
  const { width, height } = getGameSize(mountElement);
  const round = buildFindCircleRound({
    gridSize: config.gridSize,
    sizeMode: config.figureSizeMode,
    correctCount: config.correctObjectCount,
  });

  let disposed = false;
  let completed = false;
  let foundCount = 0;
  let wrongCount = 0;
  let totalTaps = 0;
  let previewLeft = config.previewSeconds;
  let gameTimeLeft = config.maxGameSeconds;
  let gameStartedAt = 0;

  const timers: number[] = [];
  const root = new Container();
  const previewLayer = new Container();
  const gameLayer = new Container();
  gameLayer.visible = false;

  app.stage.addChild(root);
  root.addChild(previewLayer, gameLayer);
  app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

  const previewTitle = new Text(
    "Remember this shape",
    new TextStyle({
      fill: "#ffffff",
      fontSize: Math.max(28, Math.min(52, width * 0.038)),
      fontFamily: "Arial",
      fontWeight: "700",
    }),
  );
  previewTitle.anchor.set(0.5, 0);
  previewTitle.x = width / 2;
  previewTitle.y = 36;
  previewLayer.addChild(previewTitle);

  const previewHint = new Text(
    "It will disappear, then select every matching figure in the grid.",
    new TextStyle({
      fill: "#bdbdbd",
      fontSize: Math.max(16, Math.min(22, width * 0.018)),
      fontFamily: "Arial",
      align: "center",
      wordWrap: true,
      wordWrapWidth: Math.min(760, width - 40),
    }),
  );
  previewHint.anchor.set(0.5, 0);
  previewHint.x = width / 2;
  previewHint.y = 92;
  previewLayer.addChild(previewHint);

  const previewCard = new Graphics();
  const previewCardSize = Math.min(width * 0.38, height * 0.42, 340);
  drawCard(previewCard, previewCardSize, COLORS.white);
  previewCard.x = width / 2;
  previewCard.y = height / 2;
  previewLayer.addChild(previewCard);

  const previewShape = new Graphics();
  drawShape(previewShape, round.targetKind, previewCardSize * 0.42, COLORS.white);
  previewShape.x = width / 2;
  previewShape.y = height / 2;
  previewLayer.addChild(previewShape);

  const countdownText = new Text(
    `Starting in ${previewLeft}s`,
    new TextStyle({
      fill: "#ffffff",
      fontSize: Math.max(22, Math.min(34, width * 0.026)),
      fontFamily: "Arial",
      fontWeight: "700",
    }),
  );
  countdownText.anchor.set(0.5, 1);
  countdownText.x = width / 2;
  countdownText.y = height - 28;
  previewLayer.addChild(countdownText);

  const topTitle = new Text(
    "Select all matching shapes",
    new TextStyle({
      fill: "#ffffff",
      fontSize: Math.max(26, Math.min(46, width * 0.03)),
      fontFamily: "Arial",
      fontWeight: "700",
    }),
  );
  topTitle.anchor.set(0.5, 0);
  topTitle.x = width / 2;
  topTitle.y = 20;
  gameLayer.addChild(topTitle);

  const statusText = new Text(
    "The preview is hidden now. Tap every correct figure.",
    new TextStyle({
      fill: "#bdbdbd",
      fontSize: Math.max(15, Math.min(21, width * 0.016)),
      fontFamily: "Arial",
      align: "center",
      wordWrap: true,
      wordWrapWidth: Math.min(720, width - 48),
    }),
  );
  statusText.anchor.set(0.5, 0);
  statusText.x = width / 2;
  statusText.y = 66;
  gameLayer.addChild(statusText);

  const counterText = makeCounterLabel(`Found ${foundCount}/${round.correctCount}`);
  counterText.anchor.set(0.5, 0);
  counterText.x = width / 2;
  counterText.y = 108;
  gameLayer.addChild(counterText);

  const timeLeftText = makeCounterLabel(`Time left ${gameTimeLeft}s`);
  timeLeftText.anchor.set(0.5, 0);
  timeLeftText.x = width / 2;
  timeLeftText.y = 136;
  gameLayer.addChild(timeLeftText);

  const gridPaddingX = Math.max(18, width * 0.03);
  const topSpace = 196;
  const bottomSpace = 28;
  const gap = Math.max(10, Math.min(18, width * 0.012));
  const availableWidth = width - gridPaddingX * 2;
  const availableHeight = height - topSpace - bottomSpace;
  const cellSize = Math.min(
    (availableWidth - gap * (config.gridSize - 1)) / config.gridSize,
    (availableHeight - gap * (config.gridSize - 1)) / config.gridSize,
  );
  const gridWidth = cellSize * config.gridSize + gap * (config.gridSize - 1);
  const gridHeight = cellSize * config.gridSize + gap * (config.gridSize - 1);
  const startX = (width - gridWidth) / 2 + cellSize / 2;
  const startY = topSpace + Math.max(0, (availableHeight - gridHeight) / 2) + cellSize / 2;

  function finishRound(success: boolean) {
    if (completed || disposed) return;
    completed = true;
    statusText.text = success ? "Great job" : "Time is over";

    const elapsedSeconds = gameStartedAt > 0 ? Math.max(1, Math.round((Date.now() - gameStartedAt) / 1000)) : 0;
    const accuracyPercent = totalTaps > 0 ? Math.round((foundCount / totalTaps) * 100) : 0;

    const finishTimer = window.setTimeout(() => {
      if (disposed) return;
      onComplete({
        gameKey: "find-circle",
        difficulty,
        score: Math.max(foundCount - wrongCount, 0),
        maxScore: round.correctCount,
        success,
        stats: {
          correctHits: foundCount,
          wrongHits: wrongCount,
          totalTaps,
          accuracyPercent,
          elapsedSeconds,
          remainingSeconds: Math.max(gameTimeLeft, 0),
          previewSeconds: config.previewSeconds,
          maxGameSeconds: config.maxGameSeconds,
          gridSize: config.gridSize,
          figureSizeMode: config.figureSizeMode,
          correctObjectCount: round.correctCount,
          targetKind: round.targetKind,
        },
      });
    }, 700);

    timers.push(finishTimer);
  }

  function canInteract() {
    return !completed && !disposed && gameLayer.visible;
  }

  round.items.forEach((item, index) => {
    const gridItem = createGridItem({
      item,
      cellSize,
      canInteract,
      onTap: (clickedItem, updateState) => {
        totalTaps += 1;

        if (clickedItem.isCorrect) {
          foundCount += 1;
          counterText.text = `Found ${foundCount}/${round.correctCount}`;
          statusText.text = "Correct";
          updateState("correct");

          if (foundCount >= round.correctCount) {
            finishRound(true);
          }

          return;
        }

        wrongCount += 1;
        statusText.text = "Not this one";
        updateState("wrong");
      },
    });

    const col = index % config.gridSize;
    const row = Math.floor(index / config.gridSize);
    gridItem.x = startX + col * (cellSize + gap);
    gridItem.y = startY + row * (cellSize + gap);
    gameLayer.addChild(gridItem);
  });

  function startGameTimer() {
    gameStartedAt = Date.now();

    const timerInterval = window.setInterval(() => {
      if (completed || disposed) {
        window.clearInterval(timerInterval);
        return;
      }

      gameTimeLeft -= 1;
      timeLeftText.text = `Time left ${Math.max(gameTimeLeft, 0)}s`;

      if (gameTimeLeft <= 0) {
        window.clearInterval(timerInterval);
        finishRound(false);
      }
    }, 1000);

    timers.push(timerInterval);
  }

  const interval = window.setInterval(() => {
    previewLeft -= 1;

    if (previewLeft > 0) {
      countdownText.text = `Starting in ${previewLeft}s`;
      return;
    }

    countdownText.text = "Go";
    previewLayer.visible = false;
    gameLayer.visible = true;
    startGameTimer();
    window.clearInterval(interval);
  }, 1000);

  timers.push(interval);

  return () => {
    disposed = true;
    timers.forEach((timerId) => {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
    });
    app.destroy(true, { children: true });
  };
}
