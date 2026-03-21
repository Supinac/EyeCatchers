import * as PIXI from 'pixi.js';
import { buildKeysRound } from './KeysLogic';
import { KeyGraphics } from './KeyGraphics';
import type { KeysGameConfig } from './KeysGameConfig';

export function mountKeysScene(mountElement: HTMLElement, config: KeysGameConfig) {
  // Inicializace PixiJS aplikace
  const app = new PIXI.Application({
    resizeTo: mountElement,
    backgroundColor: 0x000000,
  });
  mountElement.appendChild(app.view as any);

  // 1. Vygenerování datového modelu
  const blueprints = buildKeysRound(config);

  // 2. Vykreslení klíčů do surového gridu (pro test)
  const cellSize = 120; // Velikost jedné buňky
  blueprints.forEach((bp, index) => {
    const keyView = new KeyGraphics(bp);
    
    // Výpočet pozice v gridu (zatím bez centrování na střed obrazovky)
    const col = index % config.gridSize;
    const row = Math.floor(index / config.gridSize);
    
    keyView.x = 100 + col * cellSize;
    keyView.y = 100 + row * cellSize;
    
    app.stage.addChild(keyView);
  });

  // Cleanup funkce pro React useEffect, aby nezůstávaly viset WebGL kontexty
  return () => {
    app.destroy(true, { children: true });
  };
}