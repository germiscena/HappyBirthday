import { GameApp } from './app/GameApp.js';
import { soundManager } from './audio/SoundManager.js';
import { BirthdayModal } from './ui/BirthdayModal.js';

window.addEventListener('DOMContentLoaded', async () => {
  const gameContainer = document.getElementById('game-container');
  const startScreen = document.getElementById('start-screen');
  const btnStart = document.getElementById('btn-start');
  const orientationOverlay = document.getElementById('orientation-overlay');

  // 1. Mobile orientation check
  function checkOrientation() {
    if (window.innerWidth < 900 && window.innerHeight > window.innerWidth) {
      orientationOverlay.classList.remove('hidden');
    } else {
      orientationOverlay.classList.add('hidden');
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();

  // 2. Initialize Modals & Sound
  window.soundManager = soundManager;
  const birthdayModal = new BirthdayModal();
  window.birthdayModal = birthdayModal;

  // Auto-hide start screen if a specific scene or direct mode is specified in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('scene') || urlParams.get('autostart') === 'true') {
    startScreen.classList.add('hidden');
  }

  // 3. Initialize Game Engine
  const game = new GameApp();
  window.gameApp = game;
  await game.init(gameContainer);

  // Auto-trigger dialogue or action for automated testing / screenshot verification
  const autoDialogue = urlParams.get('dialogue');
  const autoAction = urlParams.get('action');
  if (autoDialogue || autoAction) {
    const targetKey = autoDialogue || autoAction;
    const tryTrigger = (attempts = 0) => {
      const scene = window.gameApp?.sceneManager?.currentScene;
      if (scene && scene[targetKey]) {
        if (typeof scene[targetKey].onClick === 'function') {
          scene[targetKey].onClick();
        } else if (typeof scene[targetKey] === 'function') {
          scene[targetKey]();
        }
      } else if (attempts < 20) {
        setTimeout(() => tryTrigger(attempts + 1), 200);
      }
    };
    setTimeout(tryTrigger, 800);
  }

  // Auto-trigger birthday modal for automated testing / screenshot verification
  const autoModal = urlParams.get('modal');
  const reqScene = urlParams.get('scene');
  if (autoModal === 'birthday' || reqScene === 'scene08_modal') {
    const tryModal = (attempts = 0) => {
      if (window.birthdayModal) {
        window.birthdayModal.show();
      } else if (attempts < 20) {
        setTimeout(() => tryModal(attempts + 1), 200);
      }
    };
    setTimeout(tryModal, 600);
  }

  // 4. Connect Start Button
  btnStart.addEventListener('click', async () => {
    // Sound & Fullscreen activation on user gesture
    soundManager.startBgm();
    soundManager.playClick();

    // Request fullscreen on devices supporting it (fallback gracefully if blocked)
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen not allowed or denied by browser - game still works perfectly
      });
    }

    // Hide Start Screen with smooth transition
    startScreen.classList.add('hidden');
  });
});
