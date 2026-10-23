import { soundManager } from '../audio/SoundManager.js';
import { Haptics } from '../core/Haptics.js';

export class PhotoCardModal {
  constructor() {
    this.isOpen = false;
    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'photo-card-modal';
    this.overlay.className = 'photo-modal-overlay hidden';

    this.overlay.innerHTML = `
      <div class="photo-card-container">
        <button id="btn-close-photo" class="photo-close-btn" aria-label="Закрыть">&times;</button>
        
        <div class="photo-card-header">
          <span class="photo-card-tag"><span class="photo-tag-text">📸 СЕМЕЙНЫЙ АЛЬБОМ</span><span class="photo-tag-date"> • 1 СЕНТЯБРЯ 2009</span></span>
        </div>

        <div class="photo-card-frame">
          <div class="photo-viewport">
            <img src="/assets/environments/scene01b_school.jpg" class="photo-bg-img" alt="Школа" />
            <div class="photo-family-layer">
              <div class="photo-char-wrap dad">
                <img src="/assets/characters/scene01b_dad.png" class="photo-char" alt="Папа" />
              </div>
              <div class="photo-char-wrap mom">
                <img src="/assets/characters/scene01b_mom.png" class="photo-char" alt="Мама" />
              </div>
              <div class="photo-char-wrap olesya">
                <img src="/assets/characters/scene01b_olesya.png" class="photo-char" alt="Олеся" />
              </div>
              <div class="photo-char-wrap sister">
                <img src="/assets/characters/scene01b_sister.png" class="photo-char" alt="Янка" />
              </div>
            </div>
            <div class="photo-vignette"></div>
          </div>
        </div>

        <div class="photo-card-footer">
          <div class="photo-caption-main">«1 сентября 2009, СЫЫР! 📸✨»</div>
          <div class="photo-caption-sub">Лошницкая гимназия • Первый раз в первый класс</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const btnClose = this.overlay.querySelector('#btn-close-photo');
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Close when clicking outside the card on the backdrop
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Close on Escape key press
    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.hide();
      }
    });
  }

  show() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.overlay.classList.remove('hidden');
    const card = this.overlay.querySelector('.photo-card-container');
    if (card) {
      card.classList.remove('photo-card-exit');
      card.classList.add('photo-card-enter');
    }

    soundManager.playCameraShutter();
    Haptics.light();
  }

  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;

    const card = this.overlay.querySelector('.photo-card-container');
    if (card) {
      card.classList.remove('photo-card-enter');
      card.classList.add('photo-card-exit');
    }

    soundManager.playClick();

    setTimeout(() => {
      if (!this.isOpen) {
        this.overlay.classList.add('hidden');
      }
    }, 280);
  }
}
