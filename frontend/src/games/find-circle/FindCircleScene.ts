import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import { getGameSize } from "../pixi/PixiResize";
import { PixiTheme } from "../pixi/PixiTheme";
import { buildFindCircleRound, type ShapeKind } from "./FindCircleLogic";
import type { GameDifficulty } from "../core/types/GameDefinition";
import type { GameResult } from "../core/types/GameResult";

function drawShape(kind: ShapeKind, size: number) {
  const graphic = new Graphics();
  graphic.lineStyle(4, PixiTheme.foreground, 1);

  if (kind === "circle") {
    graphic.drawCircle(0, 0, size / 2);
  }

  if (kind === "square") {
    graphic.drawRect(-size / 2, -size / 2, size, size);
  }

  if (kind === "triangle") {
    graphic.moveTo(0, -size / 2);
    graphic.lineTo(size / 2, size / 2);
    graphic.lineTo(-size / 2, size / 2);
    graphic.lineTo(0, -size / 2);
  }

  graphic.endFill();
  return graphic;
}

export async function mountFindCircleScene({
  mountElement,
  difficulty,
  onComplete,
}: {
  mountElement: HTMLDivElement;
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
}) {
  const app = await createPixiApp(mountElement);
  const { width, height } = getGameSize(mountElement);
  const shapes = buildFindCircleRound(difficulty);
  let completed = false;

  const root = new Container();
  app.stage.addChild(root);

  const title = new Text("Tap the circle", new TextStyle({
    fill: "#ffffff",
    fontSize: 28,
    fontFamily: "Arial",
  }));
  title.x = 24;
  title.y = 24;
  root.addChild(title);

  const hint = new Text("One correct answer. Calm, no animation.", new TextStyle({
    fill: "#cfcfcf",
    fontSize: 16,
    fontFamily: "Arial",
  }));
  hint.x = 24;
  hint.y = 62;
  root.addChild(hint);

  const feedback = new Text("", new TextStyle({
    fill: "#ffffff",
    fontSize: 20,
    fontFamily: "Arial",
  }));
  feedback.x = 24;
  feedback.y = 100;
  root.addChild(feedback);

  const cols = width < 700 ? 2 : 4;
  const gapX = width / (cols + 1);
  const rows = Math.ceil(shapes.length / cols);
  const gapY = Math.max(110, (height - 200) / (rows + 1));

  shapes.forEach((shape, index) => {
    const item = drawShape(shape.kind, 70);
    const col = index % cols;
    const row = Math.floor(index / cols);

    item.x = gapX * (col + 1);
    item.y = 180 + gapY * row;
    item.eventMode = "static";
    item.cursor = "pointer";

    item.on("pointertap", () => {
      if (completed) return;

      if (shape.isCorrect) {
        completed = true;
        feedback.text = "Good job";
        window.setTimeout(() => {
          onComplete({
            gameKey: "find-circle",
            difficulty,
            score: 1,
            maxScore: 1,
            success: true,
          });
        }, 500);
      } else {
        feedback.text = "Try again";
      }
    });

    root.addChild(item);
  });

  return () => {
    app.destroy(true, { children: true });
  };
}
