import { GameApp } from './app/GameApp.js';
import { soundManager } from './audio/SoundManager.js';
import { BirthdayModal } from './ui/BirthdayModal.js';

window.addEventListener('DOMContentLoaded', async () => {
  const gameContainer = document.getElementById('game-container');
  const startScreen = document.getElementById('start-screen');
  const btnStart = document.getElementById('btn-start');
  const orientationOverlay = document.getElementById('orientation-overlay');

  // Helper to attempt locking orientation to landscape
  async function lockLandscapeOrientation() {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      }
    } catch (_) {
      // Fullscreen not permitted or ignored
    }

    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      } else if (screen.webkitLockOrientation) {
        screen.webkitLockOrientation('landscape');
      } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('landscape');
      }
    } catch (_) {
      // Screen orientation lock not supported (e.g. iOS Safari) or denied
    }
  }

  // 1. Mobile orientation check
  function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobileOrNarrow = window.innerWidth < 1024 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isPortrait && isMobileOrNarrow) {
      orientationOverlay.classList.remove('hidden');
    } else {
      orientationOverlay.classList.add('hidden');
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();

  // Tapping the orientation card also attempts automatic fullscreen & rotation
  if (orientationOverlay) {
    orientationOverlay.addEventListener('click', () => {
      lockLandscapeOrientation();
    });
  }

  // 2. Initialize Modals & Sound
  window.soundManager = soundManager;
  const birthdayModal = new BirthdayModal();
  window.birthdayModal = birthdayModal;

  // Auto-hide start screen if a specific scene or direct mode is specified in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('scene') || urlParams.get('autostart') === 'true') {
    startScreen.classList.add('hidden');
  }

  // Smart TV Mode detection & UI toggle
  function initTvMode() {
    const tvParam = urlParams.get('tv') || urlParams.get('mode');
    let stored = null;
    try {
      stored = localStorage.getItem('tv_mode_enabled');
    } catch (_) {
      // LocalStorage access fallback
    }

    const ua = navigator.userAgent || '';
    const isTvUA = /SmartTV|Tizen|webOS|NetCast|HbbTV|Android.*TV|BRAVIA|Viera|AppleTV|Roku|AFTT|AFTM|CrKey|Hisense|POV_TV|GoogleTV|Large Screen/i.test(ua);
    const isTvMedia = window.matchMedia && window.matchMedia('(tv)').matches;

    let isTv = false;
    if (tvParam === '1' || tvParam === 'true' || tvParam === 'tv') {
      isTv = true;
    } else if (tvParam === '0' || tvParam === 'false') {
      isTv = false;
    } else if (stored !== null) {
      isTv = stored === 'true';
    } else if (isTvUA || isTvMedia) {
      isTv = true;
    }

    const btnToggleTv = document.getElementById('btn-toggle-tv');

    function applyTvMode(enabled) {
      if (enabled) {
        document.body.classList.add('tv-mode');
        document.documentElement.classList.add('tv-mode');
      } else {
        document.body.classList.remove('tv-mode');
        document.documentElement.classList.remove('tv-mode');
      }

      if (btnToggleTv) {
        btnToggleTv.setAttribute('aria-pressed', String(enabled));
        const stateEl = btnToggleTv.querySelector('.tv-toggle-state');
        if (stateEl) {
          stateEl.textContent = enabled ? 'Вкл' : 'Выкл';
        }
      }
    }

    applyTvMode(isTv);

    if (btnToggleTv) {
      btnToggleTv.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextState = !document.body.classList.contains('tv-mode');
        try {
          localStorage.setItem('tv_mode_enabled', String(nextState));
        } catch (_) {}
        applyTvMode(nextState);
        if (window.soundManager) {
          window.soundManager.playClick();
        }
      });
    }

    // Keyboard shortcut 'T' to toggle TV mode quickly (useful for Smart TV remotes / air mice / testing)
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T' || e.code === 'KeyT') {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        const nextState = !document.body.classList.contains('tv-mode');
        try {
          localStorage.setItem('tv_mode_enabled', String(nextState));
        } catch (_) {}
        applyTvMode(nextState);
        if (window.soundManager) {
          window.soundManager.playClick();
        }
      }
    });
  }

  initTvMode();

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
  btnStart.addEventListener('click', () => {
    // Sound activation on user gesture
    soundManager.startBgm();
    soundManager.playClick();

    // Attempt automatic switch to fullscreen & landscape orientation immediately on user gesture
    lockLandscapeOrientation();

    // Hide Start Screen with smooth transition
    startScreen.classList.add('hidden');
  });
});
