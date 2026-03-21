import * as PIXI from 'pixi.js';
import { KeyBlueprint } from './KeysLogic';

export class KeyGraphics extends PIXI.Container {
  private body: PIXI.Graphics;
  private blueprint: KeyBlueprint;

  constructor(blueprint: KeyBlueprint) {
    super();
    this.blueprint = blueprint;
    this.body = new PIXI.Graphics();
    this.addChild(this.body);
    
    this.draw();
    this.applyTransformations();
  }

  private draw() {
    const { body } = this;
    const { teethCount } = this.blueprint;

    body.clear();
    
    const color = 0xFFFFFF;
    const strokeColor = 0xCCCCCC;
    
    body.lineStyle(2, strokeColor);
    body.beginFill(color);

    // 1. RING (HLAVA)
    body.drawCircle(-20, 0, 15);
    body.beginHole();
    body.drawCircle(-20, 0, 8);
    body.endHole();

    // 2. SHAFT (DŘÍK)
    body.drawRect(-5, -3, 55, 6);

    // 3. TEETH (ZUBY)
    const toothW = 6;
    const toothH = 8;
    const gap = 4;
    const startX = 40;

    for (let i = 0; i < teethCount; i++) {
      const xPos = startX - (i * (toothW + gap));
      body.drawRect(xPos, -3 - toothH, toothW, toothH);
    }
    
    body.endFill();
  }

  private applyTransformations() {
    const { rotation, isMirrored, scale } = this.blueprint.visualMetadata;
    
    this.rotation = rotation;
    this.scale.set(scale, isMirrored ? -scale : scale);
  }
}