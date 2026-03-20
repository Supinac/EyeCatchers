import { Container, Text, TextStyle } from "pixi.js";
import { createPixiApp } from "../pixi/PixiAppFactory";
import type { RegisteredGame } from "../core/engine/GameRegistry";

export function PlaceholderGame(gameKey: string, title: string): RegisteredGame {
  return {
    key: gameKey,
    render: ({ mountElement, difficulty, onComplete }) => {
      let appDestroy: (() => void) | undefined;

      void createPixiApp(mountElement).then((app) => {
        const root = new Container();
        app.stage.addChild(root);

        const message = new Text(`${title}

This game is a placeholder.
Tap anywhere to finish test flow.`, new TextStyle({
          fill: "#ffffff",
          fontSize: 24,
          align: "center",
          fontFamily: "Arial",
        }));
        message.anchor.set(0.5);
        message.x = app.screen.width / 2;
        message.y = app.screen.height / 2;
        root.addChild(message);

        app.stage.eventMode = "static";
        app.stage.on("pointertap", () => {
          onComplete({
            gameKey,
            difficulty,
            score: 0,
            maxScore: 1,
            success: true,
          });
        });

        appDestroy = () => app.destroy(true, { children: true });
      });

      return () => {
        appDestroy?.();
      };
    },
  };
}
