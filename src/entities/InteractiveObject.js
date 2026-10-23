import { Container } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Haptics } from '../core/Haptics.js';
import { DialogBubble } from '../ui/DialogBubble.js';

/**
 * Reusable Base Class for interactive world objects (fountains, instruments, bells, decor, tables)
 * Provides centralized hitArea management, tactile haptics, squash/bounce feedback,
 * spam-click protection (no stuck scale), and optional dialogue bubbles.
 */
export class InteractiveObject extends Container {
  constructor({
    x = 0,
    y = 0,
    hitArea = null,
    cursor = 'pointer',
    hapticType = 'medium',
    bounceScale = 1.15,
    bounceDuration = 110,
    soundEffect = null,
    dialogTitle = null,
    dialogText = null,
    onTap = null
  } = {}) {
    super();
    this.x = x;
    this.y = y;

    this.eventMode = 'static';
    this.cursor = cursor;
    if (hitArea) {
      this.hitArea = hitArea;
    }

    this.hapticType = hapticType;
    this.bounceScale = bounceScale;
    this.bounceDuration = bounceDuration;
    this.soundEffect = soundEffect;
    this.dialogTitle = dialogTitle;
    this.dialogText = dialogText;
    this.onTap = onTap;

    this.bounceTween = null;

    this.on('pointerdown', (e) => this.handlePointerDown(e));
  }

  handlePointerDown(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    // 1. Tactile haptic feedback
    if (this.hapticType === 'light') {
      Haptics.light();
    } else if (this.hapticType === 'celebration') {
      Haptics.celebration();
    } else {
      Haptics.medium();
    }

    // 2. Sound effect
    if (typeof this.soundEffect === 'function') {
      this.soundEffect();
    }

    // 3. Squash / Bounce Animation with deadlock protection
    this.triggerBounce();

    // 4. Speech / Toast Bubble if configured
    if (this.dialogTitle && this.dialogText) {
      const globalPos = this.toGlobal({ x: 0, y: -40 });
      DialogBubble.show(this.dialogTitle, this.dialogText, globalPos.x, globalPos.y);
    }

    // 5. Custom tap handler
    if (typeof this.onTap === 'function') {
      this.onTap(e);
    }
  }

  triggerBounce() {
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }
    this.scale.set(1.0);

    this.bounceTween = new TWEEN.Tween(this.scale)
      .to({ x: this.bounceScale, y: this.bounceScale }, this.bounceDuration)
      .yoyo(true)
      .repeat(1)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.scale.set(1.0);
        this.bounceTween = null;
      })
      .onStop(() => {
        this.scale.set(1.0);
        this.bounceTween = null;
      })
      .start();
  }

  destroy(options) {
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }
    super.destroy(options);
  }
}
