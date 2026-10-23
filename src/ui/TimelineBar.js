import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Config } from '../app/Config.js';
import { soundManager } from '../audio/SoundManager.js';
import { Haptics } from '../core/Haptics.js';

export class TimelineBar extends Container {
  constructor(virtualWidth, virtualHeight, timelineController) {
    super();
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.controller = timelineController;

    this.initTopHUD();
    this.initBottomTimeline();
  }

  initTopHUD() {
    this.topContainer = new Container();
    this.addChild(this.topContainer);

    // Top Title Background (dynamically redrawn on updateControls)
    this.titleBg = new Graphics();
    this.topContainer.addChild(this.titleBg);

    // Unified Project Title
    this.titleText = new Text({
      text: 'Дорога жизни - путь к 23',
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xffd56b,
        align: 'center'
      }
    });
    this.titleText.anchor.set(0.5);
    this.topContainer.addChild(this.titleText);

    // Stage Subtitle / Location
    this.subtitleText = new Text({
      text: '0–5 лет • Родной дом и семья',
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: 0xeae3f5,
        align: 'center'
      }
    });
    this.subtitleText.anchor.set(0.5);
    this.topContainer.addChild(this.subtitleText);

    // Top Right Controls (Mute & Fullscreen)
    this.initTopRightButtons();
  }

  initTopRightButtons() {
    const btnSize = 34;
    const rightMargin = 20;

    // Fullscreen button
    const fsBtn = new Container();
    fsBtn.x = this.virtualWidth - rightMargin - btnSize;
    fsBtn.y = 17;
    fsBtn.interactive = true;
    fsBtn.cursor = 'pointer';

    const fsBg = new Graphics();
    fsBg.roundRect(0, 0, btnSize, btnSize, 10);
    fsBg.fill({ color: 0x1a1526, alpha: 0.85 });
    fsBg.stroke({ color: 0xffd56b, alpha: 0.4, width: 1 });
    fsBtn.addChild(fsBg);

    const fsText = new Text({
      text: '⛶',
      style: { fontFamily: 'sans-serif', fontSize: 16, fill: 0xffd56b }
    });
    fsText.anchor.set(0.5);
    fsText.x = btnSize / 2;
    fsText.y = btnSize / 2;
    fsBtn.addChild(fsText);

    fsBtn.on('pointerdown', () => {
      soundManager.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    this.topContainer.addChild(fsBtn);

    // Mute button
    const muteBtn = new Container();
    muteBtn.x = fsBtn.x - btnSize - 10;
    muteBtn.y = 17;
    muteBtn.interactive = true;
    muteBtn.cursor = 'pointer';

    const muteBg = new Graphics();
    muteBg.roundRect(0, 0, btnSize, btnSize, 10);
    muteBg.fill({ color: 0x1a1526, alpha: 0.85 });
    muteBg.stroke({ color: 0xffd56b, alpha: 0.4, width: 1 });
    muteBtn.addChild(muteBg);

    const muteText = new Text({
      text: '🔊',
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffd56b }
    });
    muteText.anchor.set(0.5);
    muteText.x = btnSize / 2;
    muteText.y = btnSize / 2;
    muteBtn.addChild(muteText);

    muteBtn.on('pointerdown', () => {
      const isMuted = soundManager.toggleMute();
      muteText.text = isMuted ? '🔇' : '🔊';
    });
    this.topContainer.addChild(muteBtn);
  }

  initBottomTimeline() {
    this.bottomContainer = new Container();
    this.bottomContainer.y = this.virtualHeight - 65;
    this.addChild(this.bottomContainer);

    // Left Button: [ ← Назад ]
    this.btnBack = this.createNavButton('← Назад', 30, false, () => {
      this.controller.goBack();
    });
    this.bottomContainer.addChild(this.btnBack);

    // Right Button: [ Вперёд → ]
    this.btnForward = this.createNavButton('Вперёд →', this.virtualWidth - 170, true, () => {
      this.controller.goForward();
    });
    this.bottomContainer.addChild(this.btnForward);

    // Center Timeline Scrubber Bar
    this.timelineBarX = 185;
    this.timelineBarW = this.virtualWidth - 370;
    this.initMilestonesBar();

    this.updateControls();
  }

  initMilestonesBar() {
    this.barGraphics = new Graphics();
    this.bottomContainer.addChild(this.barGraphics);

    this.pipsContainer = new Container();
    this.bottomContainer.addChild(this.pipsContainer);

    this.drawTimelineBar();
  }

  drawTimelineBar() {
    this.barGraphics.clear();
    this.pipsContainer.removeChildren();

    // Vertically centered and balanced line & pips (y = 28 inside 44px container)
    const y = 28;
    // Track background
    this.barGraphics.roundRect(this.timelineBarX, 0, this.timelineBarW, 44, 22);
    this.barGraphics.fill({ color: 0x161320, alpha: 0.92 });
    this.barGraphics.stroke({ color: 0x4a3b63, width: 1.5 });

    // Track line (comfortable inner padding)
    const lineStartX = this.timelineBarX + 44;
    const lineEndX = this.timelineBarX + this.timelineBarW - 44;
    this.barGraphics.moveTo(lineStartX, y);
    this.barGraphics.lineTo(lineEndX, y);
    this.barGraphics.stroke({ color: 0x6e588d, width: 2 });

    // Milestones pips
    const milestones = this.controller.milestones;
    const step = (lineEndX - lineStartX) / (milestones.length - 1);

    milestones.forEach((m, idx) => {
      const px = lineStartX + idx * step;
      const isCurrent = idx === this.controller.currentIndex;

      if (isCurrent) {
        // Glowing halo
        this.barGraphics.circle(px, y, 11);
        this.barGraphics.fill({ color: 0xffd56b, alpha: 0.28 });

        // Glowing center
        this.barGraphics.circle(px, y, 5.5);
        this.barGraphics.fill({ color: 0xffd56b });
        this.barGraphics.stroke({ color: 0xffffff, width: 1.5 });
      } else {
        const isPassed = idx < this.controller.currentIndex;
        this.barGraphics.circle(px, y, 3.5);
        this.barGraphics.fill({ color: isPassed ? 0xffb84d : 0x7a6991 });
      }

      // Interactive hit area around each pip for direct navigation
      const pipHit = new Container();
      pipHit.x = px;
      pipHit.y = y;
      pipHit.eventMode = 'static';
      pipHit.cursor = 'pointer';
      pipHit.hitArea = new Rectangle(-18, -22, 36, 38);

      // Milestone age label above pip (comfortable 8px top padding from track edge)
      let ageLabel = m.age.replace(/\s*(лет|года|год)\s*/g, '');
      let labelFontSize = 10;
      if (m.id === 'scene07') {
        ageLabel = '22 Диплом';
        labelFontSize = 9;
      } else if (m.id === 'scene07b') {
        ageLabel = '22 Бал';
        labelFontSize = 9;
      }

      const labelTxt = new Text({
        text: ageLabel,
        style: {
          fontFamily: 'Comfortaa, sans-serif',
          fontSize: labelFontSize,
          fontWeight: isCurrent ? 'bold' : '600',
          fill: isCurrent ? 0xffd56b : (idx < this.controller.currentIndex ? 0xd0c4e8 : 0x7e7094),
          letterSpacing: 0.3,
          align: 'center'
        }
      });
      labelTxt.anchor.set(0.5, 1);
      labelTxt.x = 0;
      labelTxt.y = -10;
      pipHit.addChild(labelTxt);

      pipHit.on('pointerdown', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (this.controller.isTransitioning) return;
        Haptics.light();
        soundManager.playClick();
        this.controller.setIndex(idx);
      });

      this.pipsContainer.addChild(pipHit);
    });
  }

  createNavButton(label, x, isPrimary, onClick) {
    const btn = new Container();
    btn.x = x;
    btn.y = 0;
    btn.interactive = true;
    btn.cursor = 'pointer';

    const w = 140;
    const h = 44;

    const bg = new Graphics();
    btn.bg = bg;
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: isPrimary ? 0x1a0f2e : 0xffffff
      }
    });
    txt.anchor.set(0.5);
    txt.x = w / 2;
    txt.y = h / 2;
    btn.txt = txt;
    btn.addChild(txt);

    btn.on('pointerdown', (e) => {
      Haptics.light();
      onClick(e);
    });
    return btn;
  }

  updateControls() {
    const current = this.controller.getCurrentMilestone();
    this.titleText.text = 'Дорога жизни - путь к 23';
    this.subtitleText.text = `${current.age} • ${current.title}`;

    // Measure maximum text width and dynamically resize pill to avoid any overflow
    const maxTextW = Math.max(this.titleText.width, this.subtitleText.width);
    const paddingX = 26;
    const pillW = Math.max(340, Math.min(this.virtualWidth - 220, Math.ceil(maxTextW + paddingX * 2)));
    const pillH = 42;
    const pillX = (this.virtualWidth - pillW) / 2;
    const pillY = 10;

    this.titleBg.clear();
    this.titleBg.roundRect(pillX, pillY, pillW, pillH, 21);
    this.titleBg.fill({ color: 0x161320, alpha: 0.92 });
    this.titleBg.stroke({ color: 0xffd56b, alpha: 0.65, width: 1.5 });

    this.titleText.x = this.virtualWidth / 2;
    this.titleText.y = pillY + 13;

    this.subtitleText.x = this.virtualWidth / 2;
    this.subtitleText.y = pillY + 29;

    // Update Back button state
    const canBack = this.controller.canGoBack();
    this.btnBack.interactive = canBack;
    this.btnBack.alpha = canBack ? 1.0 : 0.35;
    this.btnBack.bg.clear();
    this.btnBack.bg.roundRect(0, 0, 140, 44, 22);
    this.btnBack.bg.fill({ color: 0x221a30, alpha: 0.85 });
    this.btnBack.bg.stroke({ color: 0x6e588d, width: 1.5 });

    // Update Forward button state
    const canFwd = this.controller.canGoForward();
    this.btnForward.interactive = canFwd;
    this.btnForward.alpha = canFwd ? 1.0 : 0.35;
    this.btnForward.bg.clear();
    this.btnForward.bg.roundRect(0, 0, 140, 44, 22);
    this.btnForward.bg.fill({ color: 0xffd56b });
    this.btnForward.bg.stroke({ color: 0xffebad, width: 1.5 });

    // Redraw bar pips
    this.drawTimelineBar();
  }
}
