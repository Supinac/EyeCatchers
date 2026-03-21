import { Container, Graphics, Point, Rectangle, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import { getGameSize } from "../pixi/PixiResize";
import { buildFindCircleRound, type FindCircleItem, type ShapeKind } from "./FindCircleLogic";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";
import type { FindCircleGameConfig } from "../core/types/GameConfig";
import { isUnlimitedTime } from "./FindCircleConfig";

const COLORS = {
  white: 0xffffff,
  muted: 0xbdbdbd,
  correct: 0x22c55e,
  wrong: 0xef4444,
};

type ItemPosition = {
  x: number;
  y: number;
};

function getRounded(value: number) {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
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
    graphic.drawRect(-rectWidth / 2, -rectHeight / 2, rectWidth, rectHeight);
    graphic.endFill();
    return;
  }

  if (kind === "triangle") {
    const points = [new Point(0, -half), new Point(half * 0.94, half), new Point(-half * 0.94, half)];
    graphic.drawPolygon(points);
    graphic.endFill();
    return;
  }

  if (kind === "diamond") {
    const points = [new Point(0, -half), new Point(half, 0), new Point(0, half), new Point(-half, 0)];
    graphic.drawPolygon(points);
    graphic.endFill();
    return;
  }

  const outerRadius = half;
  const innerRadius = roundedSize / 4.2;
  const points: Point[] = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    points.push(new Point(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  graphic.drawPolygon(points);
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

function createTextSymbol(value: string, size: number, color: number) {
  const label = new Text(
    value,
    new TextStyle({
      fill: color,
      fontSize: Math.max(32, Math.round(size)),
      fontFamily: "Arial",
      fontWeight: "900",
      align: "center",
    }),
  );
  label.anchor.set(0.5);
  return label;
}

function createSymbolDisplay(item: FindCircleItem, size: number, color: number) {
  if (item.contentType === "shape") {
    const graphic = new Graphics();
    drawShape(graphic, item.value as ShapeKind, size, color);
    return graphic;
  }

  return createTextSymbol(item.value, size, color);
}

function createPreviewDisplay(value: string, isShape: boolean, size: number, color: number) {
  if (isShape) {
    const graphic = new Graphics();
    drawShape(graphic, value as ShapeKind, size, color);
    return graphic;
  }

  return createTextSymbol(value, size, color);
}

function createGridItem({
  item,
  slotSize,
  canInteract,
  onTap,
}: {
  item: FindCircleItem;
  slotSize: number;
  canInteract: () => boolean;
  onTap: (item: FindCircleItem, updateState: (state: "correct" | "wrong") => void) => void;
}) {
  const container = new Container();
  const symbolLayer = new Container();
  const isShape = item.contentType === "shape";
  const symbolSize = slotSize * (isShape ? 0.94 : 0.9) * item.scale;
  const hitSize = clamp(slotSize * (isShape ? 0.78 : 0.72) * Math.max(0.82, item.scale), 46, slotSize * 1.02);

  function paint(state: "idle" | "correct" | "wrong") {
    const symbolColor = state === "correct" ? COLORS.correct : state === "wrong" ? COLORS.wrong : COLORS.white;
    symbolLayer.removeChildren().forEach((child) => child.destroy());
    symbolLayer.addChild(createSymbolDisplay(item, symbolSize, symbolColor));
  }

  paint("idle");
  container.addChild(symbolLayer);
  container.eventMode = "static";
  container.cursor = "pointer";
  container.hitArea = new Rectangle(-hitSize / 2, -hitSize / 2, hitSize, hitSize);

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

function formatModeLabel(contentMode: FindCircleGameConfig["contentMode"]) {
  if (contentMode === "letters") return "Czech letter";
  if (contentMode === "numbers") return "number";
  return "figure";
}

function getGridPositions({
  count,
  gridSize,
  width,
  height,
  topSpace,
  bottomSpace,
  padding,
  gap,
}: {
  count: number;
  gridSize: number;
  width: number;
  height: number;
  topSpace: number;
  bottomSpace: number;
  padding: number;
  gap: number;
}) {
  const availableWidth = width - padding * 2;
  const availableHeight = height - topSpace - bottomSpace;
  const cellSize = Math.min(
    (availableWidth - gap * (gridSize - 1)) / gridSize,
    (availableHeight - gap * (gridSize - 1)) / gridSize,
  );
  const gridWidth = cellSize * gridSize + gap * (gridSize - 1);
  const gridHeight = cellSize * gridSize + gap * (gridSize - 1);
  const startX = (width - gridWidth) / 2 + cellSize / 2;
  const startY = topSpace + Math.max(0, (availableHeight - gridHeight) / 2) + cellSize / 2;

  const positions: ItemPosition[] = Array.from({ length: count }, (_, index) => {
    const col = index % gridSize;
    const row = Math.floor(index / gridSize);

    return {
      x: startX + col * (cellSize + gap),
      y: startY + row * (cellSize + gap),
    };
  });

  return { positions, itemSize: cellSize * 0.96 };
}

function getRandomPositions({
  count,
  width,
  height,
  topSpace,
  bottomSpace,
  padding,
  baseSize,
}: {
  count: number;
  width: number;
  height: number;
  topSpace: number;
  bottomSpace: number;
  padding: number;
  baseSize: number;
}) {
  const playLeft = padding;
  const playRight = width - padding;
  const playTop = topSpace;
  const playBottom = height - bottomSpace;
  const playWidth = playRight - playLeft;
  const playHeight = playBottom - playTop;
  const areaSide = Math.min(playWidth, playHeight);
  const sizeBoost = count <= 4 ? 1.36 : count <= 9 ? 1.2 : count <= 16 ? 1.08 : 1;
  const desiredSize = Math.max(
    82,
    Math.min(
      baseSize * sizeBoost,
      areaSide * (count <= 4 ? 0.37 : count <= 9 ? 0.255 : count <= 16 ? 0.19 : 0.155),
    ),
  );

  function tryPlace(itemSize: number) {
    const positions: ItemPosition[] = [];
    const half = itemSize / 2;
    const gap = Math.max(18, Math.min(30, itemSize * 0.16));
    const minCenterDistance = itemSize + gap;

    for (let index = 0; index < count; index += 1) {
      let placed = false;

      for (let attempt = 0; attempt < 1800; attempt += 1) {
        const x = playLeft + half + Math.random() * Math.max(1, playWidth - itemSize);
        const y = playTop + half + Math.random() * Math.max(1, playHeight - itemSize);

        const overlaps = positions.some((position) => {
          const dx = Math.abs(position.x - x);
          const dy = Math.abs(position.y - y);
          return dx < minCenterDistance && dy < minCenterDistance;
        });

        if (!overlaps) {
          positions.push({ x, y });
          placed = true;
          break;
        }
      }

      if (!placed) {
        return null;
      }
    }

    return positions;
  }

  const fallbackMinSize = Math.max(80, Math.min(baseSize * 0.88, areaSide * 0.14));

  for (let size = desiredSize; size >= fallbackMinSize; size -= 8) {
    const positions = tryPlace(size);
    if (positions) {
      return { positions, itemSize: size };
    }
  }

  const safeSize = fallbackMinSize;
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const xStep = Math.max(safeSize + 18, playWidth / columns);
  const yStep = Math.max(safeSize + 18, playHeight / rows);
  const startX = playLeft + Math.min(playWidth, xStep * columns) / (columns * 2);
  const startY = playTop + Math.min(playHeight, yStep * rows) / (rows * 2);

  const positions: ItemPosition[] = Array.from({ length: count }, (_, index) => ({
    x: Math.min(playRight - safeSize / 2, startX + (index % columns) * xStep),
    y: Math.min(playBottom - safeSize / 2, startY + Math.floor(index / columns) * yStep),
  }));

  return {
    positions: shuffle(positions),
    itemSize: safeSize,
  };
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
    sizePercent: config.figureSizePercent,
    correctCount: config.correctObjectCount,
    contentMode: config.contentMode,
  });

  let disposed = false;
  let completed = false;
  let foundCount = 0;
  let wrongCount = 0;
  let totalTaps = 0;
  let previewLeft = config.previewSeconds;
  let gameTimeLeft = isUnlimitedTime(config.maxGameSeconds) ? Number.POSITIVE_INFINITY : config.maxGameSeconds;
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
    `Remember this ${formatModeLabel(config.contentMode)}`,
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
    "It will disappear, then tap every matching item on the screen.",
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

  const previewDisplay = createPreviewDisplay(
    round.targetValue,
    round.items[0]?.contentType === "shape",
    Math.min(width * 0.28, height * 0.34, 280),
    COLORS.white,
  );
  previewDisplay.x = width / 2;
  previewDisplay.y = height / 2;
  previewLayer.addChild(previewDisplay);

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
    "Select all matching items",
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
    "The preview is hidden now. Tap every correct item.",
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

  const timeLeftText = makeCounterLabel(isUnlimitedTime(config.maxGameSeconds) ? "Unlimited time" : `Time left ${gameTimeLeft}s`);
  timeLeftText.anchor.set(0.5, 0);
  timeLeftText.x = width / 2;
  timeLeftText.y = 136;
  gameLayer.addChild(timeLeftText);

  const gridPaddingX = Math.max(18, width * 0.03);
  const topSpace = 196;
  const bottomSpace = 28;
  const gap = Math.max(10, Math.min(18, width * 0.012));
  const gridLayout = getGridPositions({
    count: round.items.length,
    gridSize: config.gridSize,
    width,
    height,
    topSpace,
    bottomSpace,
    padding: gridPaddingX,
    gap,
  });
  const layout =
    config.placementMode === "random"
      ? getRandomPositions({
          count: round.items.length,
          width,
          height,
          topSpace,
          bottomSpace,
          padding: gridPaddingX,
          baseSize: gridLayout.itemSize,
        })
      : gridLayout;

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
          remainingSeconds: Number.isFinite(gameTimeLeft) ? Math.max(gameTimeLeft, 0) : 0,
          previewSeconds: config.previewSeconds,
          maxGameSeconds: config.maxGameSeconds,
          gridSize: config.gridSize,
          figureSizeMode: config.figureSizeMode,
          figureSizePercent: config.figureSizePercent,
          correctObjectCount: round.correctCount,
          contentMode: config.contentMode,
          placementMode: config.placementMode,
          targetValue: round.targetValue,
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
      slotSize: layout.itemSize,
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

    const position = layout.positions[index];
    if (!position) return;

    gridItem.x = position.x;
    gridItem.y = position.y;
    gameLayer.addChild(gridItem);
  });

  function startGameTimer() {
    gameStartedAt = Date.now();

    if (isUnlimitedTime(config.maxGameSeconds)) {
      timeLeftText.text = "Unlimited time";
      return;
    }

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
