import { Container, Graphics, Rectangle, Text, TextStyle } from "pixi.js";
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

function drawShape(graphic: Graphics, kind: ShapeKind, size: number, color: number) {
  graphic.clear();
  graphic.lineStyle(5, color, 1);

  if (kind === "circle") {
    graphic.drawCircle(0, 0, size / 2);
    return;
  }

  if (kind === "square") {
    graphic.drawRoundedRect(-size / 2, -size / 2, size, size, Math.max(10, size * 0.14));
    return;
  }

  if (kind === "triangle") {
    graphic.moveTo(0, -size / 2);
    graphic.lineTo(size / 2, size / 2);
    graphic.lineTo(-size / 2, size / 2);
    graphic.lineTo(0, -size / 2);
    return;
  }

  if (kind === "diamond") {
    graphic.moveTo(0, -size / 2);
    graphic.lineTo(size / 2, 0);
    graphic.lineTo(0, size / 2);
    graphic.lineTo(-size / 2, 0);
    graphic.lineTo(0, -size / 2);
    return;
  }

  const outerRadius = size / 2;
  const innerRadius = size / 4.4;
  const points: number[] = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }

  graphic.drawPolygon(points);
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
  onTap,
}: {
  item: FindCircleItem;
  cellSize: number;
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
    if (locked) return;

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
    difficulty,
    gridSize: config.gridSize,
    sizeMode: config.figureSizeMode,
  });

  let disposed = false;
  let completed = false;
  let foundCount = 0;
  let wrongCount = 0;
  let previewLeft = config.previewSeconds;

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

  const gridPaddingX = Math.max(18, width * 0.03);
  const topSpace = 168;
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

  function finishRound() {
    if (completed || disposed) return;
    completed = true;
    statusText.text = "Great job";

    const finishTimer = window.setTimeout(() => {
      if (disposed) return;
      onComplete({
        gameKey: "find-circle",
        difficulty,
        score: Math.max(round.correctCount - wrongCount, 0),
        maxScore: round.correctCount,
        success: true,
      });
    }, 700);

    timers.push(finishTimer);
  }

  round.items.forEach((item, index) => {
    const gridItem = createGridItem({
      item,
      cellSize,
      onTap: (clickedItem, updateState) => {
        if (clickedItem.isCorrect) {
          foundCount += 1;
          counterText.text = `Found ${foundCount}/${round.correctCount}`;
          statusText.text = "Correct";
          updateState("correct");

          if (foundCount >= round.correctCount) {
            finishRound();
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

  const interval = window.setInterval(() => {
    previewLeft -= 1;

    if (previewLeft > 0) {
      countdownText.text = `Starting in ${previewLeft}s`;
      return;
    }

    countdownText.text = "Go";
    previewLayer.visible = false;
    gameLayer.visible = true;
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
