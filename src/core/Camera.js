import { Container } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';

export class Camera {
  constructor(stage, virtualWidth, virtualHeight) {
    this.stage = stage;
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.shakeIntensity = 0;
  }

  panTo(targetX, duration = 800) {
    new TWEEN.Tween(this.current)
      .to({ x: targetX }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.stage.x = -this.current.x;
      })
      .start();
  }

  shake(intensity = 5, duration = 300) {
    const startX = this.stage.x;
    const startY = this.stage.y;
    const startTime = Date.now();

    const doShake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const factor = 1 - elapsed / duration;
        this.stage.x = startX + (Math.random() - 0.5) * intensity * factor;
        this.stage.y = startY + (Math.random() - 0.5) * intensity * factor;
        requestAnimationFrame(doShake);
      } else {
        this.stage.x = startX;
        this.stage.y = startY;
      }
    };
    doShake();
  }

  update() {
    TWEEN.update();
  }
}
