import { Container } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Config } from '../app/Config.js';

export class BaseScene extends Container {
  constructor(id, title) {
    super();
    this.id = id;
    this.title = title;
    this.alpha = 0;
    this.virtualWidth = Config.VIRTUAL_WIDTH;
    this.virtualHeight = Config.VIRTUAL_HEIGHT;
    this.fadeTween = null;

    // Atmospheric Parallax Layer (subtle depth for distant backgrounds)
    this.parallaxContainer = new Container();
    this.addChild(this.parallaxContainer);

    this.parallaxOffset = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };
    this.maxParallax = { x: 8, y: 4 };
    this.isParallaxActive = false;

    this.onPointerMoveBound = (e) => this.handlePointerMove(e);
    this.onPointerLeaveBound = () => this.handlePointerLeave();
  }

  setupParallax() {
    if (this.isParallaxActive || typeof window === 'undefined') return;
    this.isParallaxActive = true;
    window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
    window.addEventListener('pointerleave', this.onPointerLeaveBound, { passive: true });
  }

  cleanupParallax() {
    if (!this.isParallaxActive || typeof window === 'undefined') return;
    this.isParallaxActive = false;
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerleave', this.onPointerLeaveBound);
    this.targetParallax.x = 0;
    this.targetParallax.y = 0;
  }

  handlePointerMove(e) {
    if (!this.isParallaxActive) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / cx));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / cy));
    this.targetParallax.x = -nx * this.maxParallax.x;
    this.targetParallax.y = -ny * this.maxParallax.y;
  }

  handlePointerLeave() {
    this.targetParallax.x = 0;
    this.targetParallax.y = 0;
  }

  updateParallax(delta) {
    if (!this.parallaxContainer) return;
    this.parallaxOffset.x += (this.targetParallax.x - this.parallaxOffset.x) * 0.05 * delta;
    this.parallaxOffset.y += (this.targetParallax.y - this.parallaxOffset.y) * 0.05 * delta;
    this.parallaxContainer.x = this.parallaxOffset.x;
    this.parallaxContainer.y = this.parallaxOffset.y;
  }

  async init() {
    // Override in derived scenes
  }

  onEnter() {
    this.setupParallax();
  }

  onLeave() {
    this.cleanupParallax();
  }

  fadeIn(duration = 500) {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    return new Promise((resolve) => {
      this.fadeTween = new TWEEN.Tween(this)
        .to({ alpha: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => {
          this.fadeTween = null;
          resolve();
        })
        .onStop(() => {
          this.fadeTween = null;
          resolve();
        })
        .start();
    });
  }

  fadeOut(duration = 400) {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    return new Promise((resolve) => {
      this.fadeTween = new TWEEN.Tween(this)
        .to({ alpha: 0 }, duration)
        .easing(TWEEN.Easing.Cubic.In)
        .onComplete(() => {
          this.fadeTween = null;
          resolve();
        })
        .onStop(() => {
          this.fadeTween = null;
          resolve();
        })
        .start();
    });
  }

  update(delta) {
    this.updateParallax(delta);
  }
}
