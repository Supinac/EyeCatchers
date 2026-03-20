import { Application } from "pixi.js";
import { PixiTheme } from "./PixiTheme";

export async function createPixiApp(container: HTMLDivElement) {
  const app = new Application({
    backgroundColor: PixiTheme.background,
    resizeTo: container,
    antialias: true,
  });

  container.innerHTML = "";
  container.appendChild(app.view as HTMLCanvasElement);
  return app;
}
