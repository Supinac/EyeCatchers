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

  // --- REFERENČNÍ VZOR (FIXNÍ, DOMINANTNÍ VELIKOST) ---
  const refKey = new KeyGraphics({
    id: 'REF',
    teethCount: runtimeTargetTeeth,
    isTarget: true,
    visualMetadata: { rotation: 0, isMirrored: false, scale: 1 } // Scale v BP ignorujeme
  } as KeyBlueprint);
  
  // Pivot na střed pro korektní umístění
  const refBounds = refKey.getLocalBounds();
  refKey.pivot.set(refBounds.width / 2 + refBounds.x, refBounds.height / 2 + refBounds.y);

  // ZVĚTŠENÍ REFERENČNÍHO KLÍČE:
  // Chceme, aby referenční klíč zabíral cca 15 % výšky obrazovky,
  // bez ohledu na to, jak malá je mřížka dole.
  const targetRefHeight = app.screen.height * 0.15; 
  const refScaleFactor = targetRefHeight / refBounds.height;
  refKey.scale.set(refScaleFactor);

  refKey.x = app.screen.width / 2;
  refKey.y = app.screen.height * 0.12; // Umístění nahoře
  app.stage.addChild(refKey);


  // --- DYNAMICKÝ GRID (EXTRÉMNÍ MEZERY) ---
  const gridContainer = new PIXI.Container();
  app.stage.addChild(gridContainer);

  // Větší plocha pro mřížku (90 % šířky, 65 % výšky pod vzorem)
  const areaWidth = app.screen.width * 0.9;
  const areaHeight = app.screen.height * 0.65;
  
  // Stride je vzdálenost mezi středy klíčů
  const stride = Math.min(areaWidth / config.gridSize, areaHeight / config.gridSize);
  
  // EXTRÉMNÍ MEZERY: keyGapRatio určuje, kolik z buňky zabírá klíč.
  // 2.5 znamená, že mřížka je obří, ale klíče jsou v ní malinké tečky.
  const keyGapRatio = 2.5; 
  
  // Globální měřítko pro mřížku (180 je odhadovaná nativní šířka grafiky)
  const baseGridScale = (stride * keyGapRatio) / (180 * (1 + config.scaleVariation));

  // Filtry pro barvy
  const greenFilter = new PIXI.filters.ColorMatrixFilter();
  greenFilter.matrix = [0,0,0,0,0, 0,1,0,0,0, 0,0,0,0,0, 0,0,0,1,0];
  const redFilter = new PIXI.filters.ColorMatrixFilter();
  redFilter.matrix = [1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,1,0];

  blueprints.forEach((bp: KeyBlueprint, index: number) => {
    const key = new KeyGraphics(bp);
    key.eventMode = 'static';
    key.cursor = 'pointer';
    
    // Aplikace měřítka mřížky se zachováním náhodné variability
    key.scale.set(baseGridScale * bp.visualMetadata.scale);

    // Pivot na střed
    const bounds = key.getLocalBounds();
    key.pivot.set(bounds.width / 2 + bounds.x, bounds.height / 2 + bounds.y);

    key.on('pointerdown', () => {
      if (bp.isTarget) {
        key.filters = [greenFilter];
        key.alpha = 0.8;
      } else {
        key.filters = [redFilter];
        setTimeout(() => { if (key) key.filters = []; }, 300);
      }
    });

    const col = index % config.gridSize;
    const row = Math.floor(index / config.gridSize);
    
    // Pozicování klíčů
    key.x = col * stride;
    key.y = row * stride;
    
    gridContainer.addChild(key);
  });

  // Vycentrování celého gridu
  gridContainer.pivot.set(gridContainer.width / 2, gridContainer.height / 2);
  gridContainer.x = app.screen.width / 2;
  // Posuneme grid níže, aby nahoře zbyl prostor pro velký vzor
  gridContainer.y = app.screen.height * 0.45 + (gridContainer.height / 2);

  return () => {
    app.destroy(true, { children: true });
  };
}