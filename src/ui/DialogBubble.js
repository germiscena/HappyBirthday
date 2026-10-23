import { Config } from '../app/Config.js';

export class DialogBubble {
  static currentBubble = null;
  static timeout = null;
  static fadeTimeout = null;

  static show(speaker, text, screenX, screenY, duration = 4000) {
    const layer = document.getElementById('ui-layer');
    if (!layer) return;

    // Clean up any existing bubbles in the ui layer immediately
    const existingBubbles = layer.querySelectorAll('.dialog-bubble');
    existingBubbles.forEach(b => {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
    this.hide(true);

    // Convert Pixi virtual stage coordinates to screen CSS coordinates
    const canvas = document.querySelector('#game-container canvas');
    let clientX = screenX;
    let clientY = screenY;
    let scaleX = 1;
    let scaleY = 1;

    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const virtW = Config.VIRTUAL_WIDTH || 1024;
      const virtH = Config.VIRTUAL_HEIGHT || 576;
      scaleX = rect.width / virtW;
      scaleY = rect.height / virtH;

      // Project character position to screen pixels
      clientX = rect.left + screenX * scaleX;
      // Position above the head / badge (with a small margin)
      clientY = rect.top + screenY * scaleY - 10 * scaleY;
    }

    const bubble = document.createElement('div');
    bubble.className = 'dialog-bubble';
    bubble.innerHTML = `
      <div class="dialog-speaker">${speaker}</div>
      <div class="dialog-text">${text}</div>
    `;

    // Clicking / tapping bubble directly dismisses it smoothly
    bubble.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hide(false);
    });

    layer.appendChild(bubble);
    this.currentBubble = bubble;

    // Measure actual rendered dimensions to guarantee safe placement without clipping
    const bRect = bubble.getBoundingClientRect();
    const halfW = bRect.width / 2;
    const padding = 16;
    const minX = halfW + padding;
    const maxX = window.innerWidth - halfW - padding;
    clientX = Math.max(minX, Math.min(maxX, clientX));

    // Calculate safe top clearance taking into account top HUD, decorations & stage rigs
    const topSafeMargin = canvas ? Math.max(86, canvas.getBoundingClientRect().top + 84 * scaleY) : 86;
    const bottomSafeMargin = window.innerHeight - 72;

    // Check if positioning above would bump into top HUD or stage ceiling elements
    if (clientY - bRect.height < topSafeMargin) {
      if (clientY + bRect.height + 40 < bottomSafeMargin) {
        bubble.classList.add('bubble-down');
        clientY = clientY + (scaleY ? 38 * scaleY : 36);
      } else {
        clientY = topSafeMargin + bRect.height;
      }
    } else if (clientY > bottomSafeMargin) {
      clientY = bottomSafeMargin;
    }

    bubble.style.left = `${Math.round(clientX)}px`;
    bubble.style.top = `${Math.round(clientY)}px`;

    this.timeout = setTimeout(() => {
      this.hide(false);
    }, duration);
  }

  static hide(immediate = false) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (!this.currentBubble) return;

    const bubble = this.currentBubble;

    if (immediate || !bubble.parentNode) {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
      this.currentBubble = null;
    } else {
      // Smooth fade-out matching popIn duration and easing
      bubble.classList.add('bubble-fade-out');
      this.currentBubble = null; // Detach reference immediately so new clicks aren't blocked

      this.fadeTimeout = setTimeout(() => {
        if (bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
        }
      }, 280);
    }
  }
}
