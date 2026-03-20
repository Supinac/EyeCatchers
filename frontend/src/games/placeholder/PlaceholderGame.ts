import { Container, Rectangle, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import type { RegisteredGame } from "../core/engine/GameRegistry";

export function PlaceholderGame(gameKey: string, title: string): RegisteredGame {
  return {
    key: gameKey,
    render: ({ mountElement, difficulty, onComplete }) => {
      const app = createPixiApp(mountElement);
      const root = new Container();
      app.stage.addChild(root);

      const message = new Text(
        `${title}\n\nThis game is a placeholder.\nTap anywhere to finish test flow.`,
        new TextStyle({
          fill: "#ffffff",
          fontSize: 24,
          align: "center",
          fontFamily: "Arial",
        }),
      );
      message.anchor.set(0.5);
      message.x = app.screen.width / 2;
      message.y = app.screen.height / 2;
      root.addChild(message);

      app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
      app.stage.on("pointertap", () => {
        onComplete({
          gameKey,
          difficulty,
          score: 0,
          maxScore: 1,
          success: true,
        });
      });

      return () => {
        app.destroy(true, { children: true });
      };
    },
  };
}
