import * as PIXI from 'pixi.js';
import { buildKeysRound } from './KeysLogic';
import { KeysGameConfig, KeyBlueprint } from './KeysGameConfig';
import { KeyGraphics } from './KeyGraphics';

export function mountKeysScene(mountElement: HTMLElement, config: KeysGameConfig) {
  const app = new PIXI.Application({
    resizeTo: mountElement,
    backgroundColor: 0x0a0a0a,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  mountElement.appendChild(app.view as any);

  const { blueprints, runtimeTargetTeeth } = buildKeysRound(config);

  // --- REFERENČNÍ VZOR ---
  const refKey = new KeyGraphics({
    id: 'REF',
    teethCount: runtimeTargetTeeth,
    isTarget: true,
    visualMetadata: { rotation: 0, isMirrored: false, scale: 1.3 }
  } as KeyBlueprint);
  refKey.x = app.screen.width / 2;
  refKey.y = 80;
  app.stage.addChild(refKey);

  // --- DYNAMICKÝ GRID ---
  const gridContainer = new PIXI.Container();
  app.stage.addChild(gridContainer);

  const areaWidth = app.screen.width * 0.85;
  const areaHeight = app.screen.height * 0.55;
  const rawCellSize = Math.min(areaWidth / config.gridSize, areaHeight / config.gridSize);

  // Definice filtrů pro barevnou zpětnou vazbu
  const greenFilter = new PIXI.filters.ColorMatrixFilter();
  greenFilter.matrix = [0,0,0,0,0, 0,1,0,0,0, 0,0,0,0,0, 0,0,0,1,0]; // Zelená
  const redFilter = new PIXI.filters.ColorMatrixFilter();
  redFilter.matrix = [1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,1,0];   // Červená

  blueprints.forEach((bp: KeyBlueprint, index: number) => {
    const key = new KeyGraphics(bp);
    key.eventMode = 'static';
    key.cursor = 'pointer';
    
    key.on('pointerdown', () => {
      if (bp.isTarget) {
        key.filters = [greenFilter];
        key.alpha = 0.6;
      } else {
        key.filters = [redFilter];
        // Krátký vizuální reset po chybě
        setTimeout(() => { if (key) key.filters = []; }, 300);
      }
    });

    const col = index % config.gridSize;
    const row = Math.floor(index / config.gridSize);
    key.x = col * rawCellSize;
    key.y = row * rawCellSize;
    gridContainer.addChild(key);
  });

  gridContainer.pivot.set(gridContainer.width / 2, gridContainer.height / 2);
  gridContainer.x = app.screen.width / 2;
  gridContainer.y = app.screen.height * 0.65;

  return () => app.destroy(true, { children: true });
}