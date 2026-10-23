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
    let canvasRect = null;

    if (canvas) {
      canvasRect = canvas.getBoundingClientRect();
      const virtW = Config.VIRTUAL_WIDTH || 1024;
      const virtH = Config.VIRTUAL_HEIGHT || 576;
      scaleX = canvasRect.width / virtW;
      scaleY = canvasRect.height / virtH;

      // Project character position to screen pixels
      clientX = canvasRect.left + screenX * scaleX;
      // Position above the head / badge (with a comfortable breathable margin)
      clientY = canvasRect.top + screenY * scaleY - Math.max(12, 16 * scaleY);
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
    const padding = 12;
    const minX = halfW + padding;
    const maxX = window.innerWidth - halfW - padding;
    const rawTargetX = clientX;
    clientX = Math.max(minX, Math.min(maxX, clientX));

    // Dynamic tail offset relative to bubble left edge (keeps arrow pointing directly at character)
    const bubbleLeft = clientX - halfW;
    const tailOffset = Math.max(14, Math.min(bRect.width - 14, rawTargetX - bubbleLeft));
    bubble.style.setProperty('--tail-x', `${Math.round(tailOffset)}px`);

    // Calculate safe boundaries:
    // In landscape, HUD ends at ~44 virtual px from canvas top.
    // In portrait, canvas is vertically centered with letterboxing; the area above canvas is open and safe!
    const canvasTop = canvasRect ? canvasRect.top : 0;
    const isPortraitLetterbox = (window.innerHeight > window.innerWidth) && canvasRect && (canvasRect.top > 35);
    const screenTopBoundary = isPortraitLetterbox
      ? 12
      : Math.max(8, Math.round(canvasTop + 44 * scaleY + 6));

    const timelineVirtualY = (Config.VIRTUAL_HEIGHT || 576) - 65;
    const screenBottomBoundary = isPortraitLetterbox
      ? (window.innerHeight - 12)
      : Math.min(
          window.innerHeight - 8,
          canvasRect ? Math.round(canvasTop + timelineVirtualY * scaleY - 6) : (window.innerHeight - 60)
        );

    const bubbleH = bRect.height;
    const fitsAbove = (clientY - bubbleH >= screenTopBoundary);

    if (fitsAbove) {
      // Comfortably fits above character head without covering HUD or characters
      // Default CSS transform is translate(-50%, -100%)
    } else {
      // Check if flipping below character works better
      const feetY = canvasTop + (screenY + 95) * scaleY;
      const fitsBelow = (feetY + bubbleH + 6 <= screenBottomBoundary);
      if (fitsBelow) {
        bubble.classList.add('bubble-down');
        clientY = feetY + 6;
      } else {
        // Space is tight: clamp vertically within bounds with safety margins
        clientY = Math.max(screenTopBoundary + bubbleH, Math.min(screenBottomBoundary, clientY));
      }
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

// Cleanly dismiss speech bubble on orientation change or window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    DialogBubble.hide(true);
  });
}
