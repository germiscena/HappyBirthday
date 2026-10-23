import { Graphics, Text } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * High-performance Object Pool for particles (sparkles, hearts, confetti, water drops)
 * Completely eliminates garbage collection pauses and canvas texture recreation during gameplay.
 */
export class ParticlePool {
  static textPool = [];
  static graphicsPool = [];

  /**
   * Acquire a reusable Text sprite from the pool or instantiate one
   */
  static acquireText(text, style = {}) {
    let p;
    if (this.textPool.length > 0) {
      p = this.textPool.pop();
      p.text = text;
      p.style.fontSize = style.fontSize || 16;
      if (style.fill) p.style.fill = style.fill;
      p.alpha = 1;
      p.scale.set(1);
      p.rotation = 0;
      p.visible = true;
    } else {
      p = new Text({
        text,
        style: {
          fontFamily: 'Comfortaa, sans-serif',
          fontSize: style.fontSize || 16,
          fill: style.fill || 0xffd56b
        }
      });
      p.anchor.set(0.5);
    }
    return p;
  }

  /**
   * Acquire a reusable Graphics sprite from the pool or instantiate one
   */
  static acquireGraphics() {
    let g;
    if (this.graphicsPool.length > 0) {
      g = this.graphicsPool.pop();
      g.clear();
      g.alpha = 1;
      g.scale.set(1);
      g.rotation = 0;
      g.visible = true;
    } else {
      g = new Graphics();
    }
    return g;
  }

  /**
   * Release a particle back to the pool
   */
  static release(p) {
    if (!p) return;
    if (p.parent) {
      p.parent.removeChild(p);
    }
    p.visible = false;

    if (p instanceof Text) {
      this.textPool.push(p);
    } else if (p instanceof Graphics) {
      p.clear();
      this.graphicsPool.push(p);
    }
  }

  /**
   * Spawn a burst of celebratory text emojis with automatic pooling and TWEEN animation
   */
  static spawnTextBurst(container, {
    x = 0,
    y = 0,
    count = 12,
    symbols = ['✨', '💖', '⭐'],
    spreadX = 90,
    spreadY = 70,
    duration = 1300,
    scaleMax = 1.35
  } = {}) {
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const p = this.acquireText(sym, {
        fontSize: Math.floor(Math.random() * 8 + 14)
      });

      p.x = x + (Math.random() - 0.5) * 35;
      p.y = y + (Math.random() - 0.5) * 20;
      container.addChild(p);

      const targetX = p.x + (Math.random() - 0.5) * spreadX * 2;
      const targetY = p.y - spreadY - Math.random() * spreadY * 0.8;
      const animDuration = duration + (Math.random() - 0.5) * 400;

      new TWEEN.Tween(p)
        .to({ x: targetX, y: targetY, alpha: 0 }, animDuration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.release(p);
        })
        .start();

      new TWEEN.Tween(p.scale)
        .to({ x: scaleMax, y: scaleMax }, animDuration * 0.4)
        .yoyo(true)
        .repeat(1)
        .start();
    }
  }

  /**
   * Spawn a burst of rectangular festive confetti with automatic pooling
   */
  static spawnConfettiBurst(container, {
    x = 0,
    y = 0,
    count = 20,
    colors = [0xffd56b, 0xf43f5e, 0x38bdf8, 0x10b981, 0xa855f7, 0xffffff],
    spreadX = 180,
    spreadY = 100,
    duration = 850
  } = {}) {
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const g = this.acquireGraphics();
      const col = colors[Math.floor(Math.random() * colors.length)];
      const w = 6 + Math.random() * 4;
      const h = 4 + Math.random() * 3;

      g.roundRect(-w / 2, -h / 2, w, h, 1);
      g.fill({ color: col });
      g.x = x + (Math.random() - 0.5) * 35;
      g.y = y + (Math.random() - 0.5) * 20;
      g.rotation = Math.random() * Math.PI;

      container.addChild(g);

      const vx = (Math.random() - 0.5) * spreadX;
      const vy = -spreadY - Math.random() * spreadY * 0.6;
      const animDuration = duration + Math.random() * 350;

      new TWEEN.Tween(g)
        .to({
          x: g.x + vx,
          y: g.y + vy,
          rotation: g.rotation + (Math.random() - 0.5) * 4,
          alpha: 0
        }, animDuration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.release(g);
        })
        .start();
    }
  }

  /**
   * Spawn splashes / droplets of water or sparkles with automatic pooling
   */
  static spawnSplashes(container, {
    x = 0,
    y = 0,
    count = 14,
    color = 0xffffff,
    radiusMax = 3.5,
    spreadX = 100,
    spreadY = 80,
    duration = 600
  } = {}) {
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const g = this.acquireGraphics();
      const r = 2 + Math.random() * (radiusMax - 2);

      g.circle(0, 0, r);
      g.fill({ color, alpha: 0.85 });
      g.x = x + (Math.random() - 0.5) * 30;
      g.y = y + (Math.random() - 0.5) * 15;

      container.addChild(g);

      const vx = (Math.random() - 0.5) * spreadX;
      const vy = -spreadY - Math.random() * spreadY * 0.7;
      const animDuration = duration + Math.random() * 250;

      new TWEEN.Tween(g)
        .to({ x: g.x + vx, y: g.y + vy, alpha: 0 }, animDuration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.release(g);
        })
        .start();
    }
  }
}
