import { soundManager } from '../audio/SoundManager.js';
import { Haptics } from '../core/Haptics.js';

export class BirthdayModal {
  constructor() {
    this.isOpen = false;
    this.candlesBlown = false;
    this.isRestartLocked = false;
    this.restartLockTimer = null;
    this.lockRemainingSeconds = 0;
    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'birthday-modal';
    this.overlay.className = 'birthday-modal-overlay hidden';

    this.overlay.innerHTML = `
      <div class="birthday-card">
        <button id="btn-close-birthday" class="btn-close-birthday">&times;</button>
        
        <div class="birthday-header">
          <div class="birthday-tag">🎂 23 ГОДА • С ДНЁМ РОЖДЕНИЯ! 🎂</div>
          <h2 class="birthday-title">Любимая Олеся! 💖</h2>
          <div class="birthday-subtitle">История одной прекрасной жизни • Дорога жизни - путь к 23</div>
        </div>

        <div class="birthday-body">
          <div class="letter-scroll-box">
            <p class="letter-greeting">С 23-летием, моё самое яркое солнышко! ✨</p>
            
            <p>Сегодня твой день — день рождения самого замечательного, доброго, талантливого и прекрасного человека на свете.</p>
            
            <p>Мы прошли вместе через каждую страничку твоей удивительной истории:</p>
            
            <div class="letter-timeline-milestones">
              <div class="milestone-row">
                <span class="m-icon">🏡</span>
                <span class="m-text"><strong>0–5 лет:</strong> Твой родной деревянный дом, наполненный любовью папы, мамы, Янки и пушистой мурчащей Нюши.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">🔔</span>
                <span class="m-text"><strong>6 лет:</strong> 1 сентября — первый раз в первый класс, огромные белые банты, пышный букет и памятная фотография всей семьёй перед школой!</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">🎶</span>
                <span class="m-text"><strong>8–15 лет:</strong> Школьные годы, звонкий смех, занятия вокалом с мамой и первые звонкие аккорды на укулеле.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">💌</span>
                <span class="m-text"><strong>16 лет:</strong> Наша встреча на школьной перемене — зимний день, поцелуй и мгновение, навсегда изменившее мою жизнь.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">👗</span>
                <span class="m-text"><strong>17 лет:</strong> Школьный выпускной, сцена актового зала и ты — ослепительная в изумрудно-зелёном платье.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">🩺</span>
                <span class="m-text"><strong>18 лет:</strong> Поступление в медицинский университет, первые белые халаты и верные подруги рядом.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">🦷</span>
                <span class="m-text"><strong>19–21 год:</strong> Стоматологическая практика, розовая хирургичка, первые пациенты и мастерство врача.</span>
              </div>
              <div class="milestone-row">
                <span class="m-icon">🎓</span>
                <span class="m-text"><strong>22 года:</strong> Заветный синий диплом у фонтана университета и сказочный выпускной бал в сияющем серебряном платье!</span>
              </div>
            </div>

            <p class="letter-climax">
              И вот сегодня тебе 23! Ты — дипломированный, умный, чуткий доктор-стоматолог, невероятная красавица и моя самая большая любовь в жизни.
            </p>

            <p>
              Пусть каждый твой день дарит море поводов для искренней улыбки, благодарных пациентов, лёгких смен, верных друзей и исполнения всех твоих самых смелых желаний!
            </p>

            <div class="letter-signature">
              <span class="sig-text">Безумно горжусь тобой и бесконечно люблю,</span>
              <span class="sig-author">Твой Пашка 💖</span>
            </div>
          </div>
        </div>

        <div class="birthday-actions">
          <button id="btn-blow-candles" class="btn-blow-candles">
            <span class="btn-icon">🕯️</span>
            <span>Задуть свечи и загадать желание ✨</span>
          </button>
          
          <button id="btn-restart-timeline" class="btn-restart-timeline">
            <span>↺ Пройти наш путь заново</span>
          </button>
        </div>

        <div id="wish-notification" class="wish-notification hidden">
          🌟 Свечи задуты! Загаданное желание обязательно сбудется! 💖✨
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Event listeners
    const btnClose = this.overlay.querySelector('#btn-close-birthday');
    btnClose.addEventListener('click', () => this.hide());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    const btnBlow = this.overlay.querySelector('#btn-blow-candles');
    btnBlow.addEventListener('click', () => this.blowCandles());

    const btnRestart = this.overlay.querySelector('#btn-restart-timeline');
    const onRestartClick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.isRestartLocked) {
        return;
      }
      this.hide();
      if (window.gameApp && window.gameApp.timelineController) {
        window.gameApp.timelineController.setIndex(0);
      }
    };
    btnRestart.addEventListener('click', onRestartClick);
    btnRestart.addEventListener('touchend', onRestartClick);
  }

  show() {
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    soundManager.duckBgm(0.3, 0.4);
    soundManager.playSparkle();

    // 5-second lockout on restart button to prevent accidental tap on mobile
    this.startRestartLockout(5);

    const currentScene = window.gameApp?.sceneManager?.currentScene;
    const areCandlesOut = currentScene?.candlesExtinguished;

    const wishNotice = this.overlay.querySelector('#wish-notification');
    const btnBlow = this.overlay.querySelector('#btn-blow-candles');

    if (areCandlesOut) {
      if (wishNotice) wishNotice.classList.remove('hidden');
      if (btnBlow) {
        btnBlow.disabled = true;
        btnBlow.innerHTML = '<span>✨ Свечи задуты! Желание сбудется! 💖✨</span>';
        btnBlow.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    } else {
      if (wishNotice) wishNotice.classList.add('hidden');
      if (btnBlow) {
        btnBlow.disabled = false;
        btnBlow.innerHTML = '<span class="btn-icon">🕯️</span><span>Задуть свечи и загадать желание ✨</span>';
        btnBlow.style.background = '';
      }
    }
  }

  hide() {
    this.isOpen = false;
    this.overlay.classList.add('hidden');
    this.clearRestartLockout();
    this.isRestartLocked = false;
    soundManager.restoreBgm(0.5);
    soundManager.playClick();
  }

  startRestartLockout(durationSeconds = 5) {
    this.clearRestartLockout();
    this.isRestartLocked = true;
    this.lockRemainingSeconds = durationSeconds;

    const btnRestart = this.overlay?.querySelector('#btn-restart-timeline');
    if (!btnRestart) return;

    btnRestart.disabled = true;
    btnRestart.classList.add('btn-locked');
    this.updateRestartButtonLabel(btnRestart);

    this.restartLockTimer = setInterval(() => {
      this.lockRemainingSeconds--;
      if (this.lockRemainingSeconds <= 0) {
        this.unlockRestartButton();
      } else {
        this.updateRestartButtonLabel(btnRestart);
      }
    }, 1000);
  }

  unlockRestartButton() {
    this.clearRestartLockout();
    this.isRestartLocked = false;
    this.lockRemainingSeconds = 0;

    const btnRestart = this.overlay?.querySelector('#btn-restart-timeline');
    if (btnRestart) {
      btnRestart.disabled = false;
      btnRestart.classList.remove('btn-locked');
      btnRestart.innerHTML = '<span>↺ Пройти наш путь заново</span>';
    }
  }

  clearRestartLockout() {
    if (this.restartLockTimer) {
      clearInterval(this.restartLockTimer);
      this.restartLockTimer = null;
    }
  }

  updateRestartButtonLabel(btnRestart) {
    if (!btnRestart) return;
    btnRestart.innerHTML = `<span>↺ Пройти наш путь заново (${this.lockRemainingSeconds}с)</span>`;
  }

  blowCandles() {
    Haptics.celebration();
    soundManager.playCandleBlow();
    setTimeout(() => {
      soundManager.playFanfare();
      soundManager.playSparkle();
    }, 250);

    const wishNotice = this.overlay.querySelector('#wish-notification');
    if (wishNotice) {
      wishNotice.classList.remove('hidden');
    }

    const btnBlow = this.overlay.querySelector('#btn-blow-candles');
    if (btnBlow) {
      btnBlow.disabled = true;
      btnBlow.innerHTML = '<span>✨ Свечи задуты! Желание в пути! ✨</span>';
      btnBlow.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }

    // Extinguish candles in the PixiJS scene
    const currentScene = window.gameApp?.sceneManager?.currentScene;
    if (currentScene && currentScene.extinguishCandles) {
      currentScene.extinguishCandles();
    }
  }
}
