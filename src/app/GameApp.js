import { Application } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Config } from './Config.js';
import { SceneManager } from '../core/SceneManager.js';
import { TimelineController } from '../core/TimelineController.js';
import { TimelineBar } from '../ui/TimelineBar.js';
import { soundManager } from '../audio/SoundManager.js';
import { Haptics } from '../core/Haptics.js';

export class GameApp {
  constructor() {
    this.app = null;
    this.sceneManager = null;
    this.timelineController = null;
    this.timelineBar = null;
  }

  async init(containerElement) {
    this.app = new Application();

    await this.app.init({
      width: Config.VIRTUAL_WIDTH,
      height: Config.VIRTUAL_HEIGHT,
      backgroundColor: Config.COLORS.BACKGROUND_DARK,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false,
      roundPixels: true
    });

    containerElement.appendChild(this.app.canvas);

    // Setup Timeline Controller
    this.timelineController = new TimelineController(async (milestone) => {
      await this.onMilestoneChange(milestone);
    });

    // Setup Scene Manager
    this.sceneManager = new SceneManager(this.app, this.app.stage);

    // Setup Timeline UI Bar (fixed overlay inside Pixi stage)
    this.timelineBar = new TimelineBar(
      Config.VIRTUAL_WIDTH,
      Config.VIRTUAL_HEIGHT,
      this.timelineController
    );
    this.app.stage.addChild(this.timelineBar);

    // Keyboard navigation (Left / Right arrow keys & Spacebar)
    window.addEventListener('keydown', (e) => {
      // Prevent navigation while transition is in progress
      if (this.timelineController.isTransitioning) return;

      // Prevent navigation while any modal dialog is open (keepsake photo card or birthday letter)
      const hasOpenModal = document.querySelector('.birthday-modal-overlay:not(.hidden), .photo-modal-overlay:not(.hidden)') ||
        window.birthdayModal?.isOpen || window.photoModal?.isOpen;
      if (hasOpenModal) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        this.timelineController.goForward();
      } else if (e.key === 'ArrowLeft') {
        this.timelineController.goBack();
      }
    });

    // Double-tap gesture handling for romantic mini-kisses
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const handleDoubleTap = (clientX, clientY) => {
      const now = performance.now();
      const dt = now - lastTapTime;
      const dx = Math.abs(clientX - lastTapX);
      const dy = Math.abs(clientY - lastTapY);

      if (dt > 40 && dt < 380 && dx < 40 && dy < 40) {
        // Trigger double-tap!
        lastTapTime = 0;
        const currentScene = this.sceneManager?.currentScene;
        if (currentScene && (currentScene.id === 'scene03' || currentScene.id === 'scene04')) {
          const canvas = this.app?.canvas;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const virtX = ((clientX - rect.left) / rect.width) * Config.VIRTUAL_WIDTH;
            const virtY = ((clientY - rect.top) / rect.height) * Config.VIRTUAL_HEIGHT;
            soundManager.playRomanticChime();
            Haptics.light();
            if (currentScene.spawnKissBurst) {
              currentScene.spawnKissBurst(virtX, virtY);
            }
          }
        }
      } else {
        lastTapTime = now;
        lastTapX = clientX;
        lastTapY = clientY;
      }
    };

    window.addEventListener('pointerdown', (e) => {
      if (e.target && (e.target.closest('#birthday-modal') || e.target.closest('#orientation-overlay'))) {
        return;
      }
      handleDoubleTap(e.clientX, e.clientY);
    });

    // Mobile touch swipe gestures (Swipe left -> Forward, Swipe right -> Back)
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.timelineController.isTransitioning) return;
      if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        // Horizontal swipe if horizontal distance > 55px and greater than vertical movement
        if (Math.abs(diffX) > 55 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
          Haptics.swipe();
          if (diffX < 0) {
            this.timelineController.goForward();
          } else {
            this.timelineController.goBack();
          }
        }
      }
    }, { passive: true });

    // Handle responsive resizing
    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    // Start game ticker loop
    this.app.ticker.add((time) => {
      TWEEN.update();
      if (this.sceneManager) {
        this.sceneManager.update(time.deltaTime);
      }
    });

    // Load initial scene (Scene 1: Home and family 0-5 years, or URL-requested scene)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedScene = urlParams.get('scene');
    let initialIndex = 0;
    if (requestedScene === 'scene08_modal') {
      const idx = this.timelineController.milestones.findIndex(m => m.id === 'scene08');
      if (idx !== -1) initialIndex = idx;
    } else if (requestedScene) {
      const idx = this.timelineController.milestones.findIndex(m => m.id === requestedScene);
      if (idx !== -1) initialIndex = idx;
    }
    this.timelineController.currentIndex = initialIndex;

    this.timelineController.isTransitioning = true;
    this.timelineBar.updateControls();
    const initialMilestone = this.timelineController.getCurrentMilestone();
    try {
      await this.sceneManager.loadScene(initialMilestone.id);
    } finally {
      this.timelineController.isTransitioning = false;
      this.timelineBar.updateControls();
    }
  }

  async onMilestoneChange(milestone) {
    this.timelineController.isTransitioning = true;
    this.timelineBar.updateControls();
    try {
      await this.sceneManager.loadScene(milestone.id);
    } finally {
      this.timelineController.isTransitioning = false;
      this.timelineBar.updateControls();
    }
  }

  onResize() {
    if (!this.app || !this.app.canvas) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate aspect-ratio fitted scale (16:9)
    const scaleX = windowWidth / Config.VIRTUAL_WIDTH;
    const scaleY = windowHeight / Config.VIRTUAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const targetWidth = Math.round(Config.VIRTUAL_WIDTH * scale);
    const targetHeight = Math.round(Config.VIRTUAL_HEIGHT * scale);

    this.app.canvas.style.width = `${targetWidth}px`;
    this.app.canvas.style.height = `${targetHeight}px`;
  }
}
