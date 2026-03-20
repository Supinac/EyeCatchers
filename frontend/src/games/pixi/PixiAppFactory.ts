import { Application } from "pixi.js";
import { PixiTheme } from "./PixiTheme";

export function createPixiApp(container: HTMLDivElement) {
  const app = new Application({
    backgroundColor: PixiTheme.background,
    resizeTo: container,
    antialias: true,
    autoDensity: true,
  });

  container.innerHTML = "";
  const canvas = app.view as HTMLCanvasElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  return app;
}
