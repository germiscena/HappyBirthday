import { Container, Graphics, Text, Rectangle, Sprite, Assets, Texture } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene08_BirthdayCake extends BaseScene {
  constructor() {
    super('scene08', 'День рождения (23 года)');
    this.characters = [];
    this.candles = [];
    this.sparkles = [];
    this.candleTimer = 0;
    this.candlesExtinguished = false;
  }

  async init() {
    // 1. Festive Childhood House Setting with Birthday Decor
    await this.initClinicRoom();

    // 2. Birthday Balloon Numbers '23' & Festive Garlands (integrated in background)
    this.initPartyBannersAndBalloons();

    // 3. All Main Characters Lineup
    this.initAllCharactersLineup();

    // 4. Table with Giant Tooth Birthday Cake (in right lower part of screen)
    await this.initGiantToothCakeTable();

    // 5. Particles Container (Confetti, sparkles, floating hearts)
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }

  async initClinicRoom() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene08_birthday.jpg'),
        Assets.load('/assets/props/scene08_cake_table.png'),
        Assets.load('/assets/characters/scene08_dad.png'),
        Assets.load('/assets/characters/scene08_mom.png'),
        Assets.load('/assets/characters/scene08_sister.png'),
        Assets.load('/assets/characters/scene08_serega.png'),
        Assets.load('/assets/characters/scene08_pashka.png'),
        Assets.load('/assets/characters/scene08_olesya.png'),
        Assets.load('/assets/characters/scene08_liza.png'),
        Assets.load('/assets/characters/scene08_kristina.png'),
        Assets.load('/assets/characters/scene08_tanya.png'),
        Assets.load('/assets/characters/scene08_anya.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0xfcfaf7 });
      this.parallaxContainer.addChild(bg);
    }
  }

  initPartyBannersAndBalloons() {
    // Background already contains authentic pixel art decorations, bunting, and "23" balloons
  }

  async initGiantToothCakeTable() {
    // Positioned in the right lower section of the screen
    this.tableContainer = new InteractiveObject({
      x: 840,
      y: 505,
      hitArea: new Rectangle(-105, -120, 210, 130),
      hapticType: 'celebration',
      bounceScale: 1.05,
      bounceDuration: 130,
      soundEffect: () => {
        if (this.candlesExtinguished) {
          soundManager.playFanfare();
          soundManager.playChampagneClink();
        }
      },
      onTap: () => {
        if (this.candlesExtinguished) {
          this.openCelebrationModal();
        } else {
          // If tapped cake table before all candles blown, extinguish the next lit candle with smoke puff!
          const nextLit = this.candleObjects.find(c => !c.isExtinguished);
          if (nextLit) {
            this.extinguishSingleCandle(nextLit);
          }
        }
      }
    });

    try {
      const rawTexture = await Assets.load('/assets/props/scene08_cake_table.png');
      const tableTexture = new Texture({
        source: rawTexture.source,
        frame: new Rectangle(9, 379, 878, 459)
      });
      const tableSprite = new Sprite(tableTexture);
      tableSprite.anchor.set(0.5, 1);
      tableSprite.height = 105;
      tableSprite.width = 201;
      tableSprite.y = 0;
      this.tableContainer.addChild(tableSprite);
    } catch (e) {
      console.warn('Fallback cake table sprite', e);
    }

    // 5 Festive Birthday Candles placed physically on the tooth cake top surface
    this.candleObjects = [];
    const candleConfigs = [
      { cx: -13, cy: -86, color: 0xf472b6, highlight: 0xfce7f3, shadow: 0xbe185d }, // Pastel Rose Pink
      { cx: -6.5, cy: -89, color: 0x60a5fa, highlight: 0xdbeafe, shadow: 0x1d4ed8 }, // Sky Blue
      { cx: 0, cy: -85, color: 0xfbbf24, highlight: 0xfef9c3, shadow: 0xb45309 },   // Warm Gold
      { cx: 6.5, cy: -89, color: 0x34d399, highlight: 0xd1fae5, shadow: 0x047857 },  // Fresh Mint
      { cx: 13, cy: -86, color: 0xc084fc, highlight: 0xf3e8ff, shadow: 0x7e22ce }   // Lilac Purple
    ];

    candleConfigs.forEach((cfg) => {
      const candleWrap = new Container();
      candleWrap.x = cfg.cx;
      candleWrap.y = cfg.cy;
      candleWrap.eventMode = 'static';
      candleWrap.cursor = 'pointer';
      // Comfortable click hitbox covering wax body and flame
      candleWrap.hitArea = new Rectangle(-10, -28, 20, 32);

      // 1. Physical Wax Candle Body & Base Shadow
      const bodyGfx = new Graphics();

      // Frosting contact shadow
      bodyGfx.ellipse(0, 0, 3.2, 1.2);
      bodyGfx.fill({ color: 0x1e1528, alpha: 0.35 });

      // Wax pillar (width 4.5px, height 13px)
      bodyGfx.roundRect(-2.25, -13, 4.5, 13, 1);
      bodyGfx.fill({ color: cfg.color });

      // Vertical highlight on light-facing edge
      bodyGfx.rect(-1.8, -12, 1.1, 11);
      bodyGfx.fill({ color: cfg.highlight, alpha: 0.85 });

      // Vertical shadow on right edge
      bodyGfx.rect(0.7, -12, 1.1, 11);
      bodyGfx.fill({ color: cfg.shadow, alpha: 0.55 });

      // Festive diagonal spiral stripes
      bodyGfx.poly([-2.1, -10, 0, -8.2, 0.6, -8.2, -1.5, -10]);
      bodyGfx.fill({ color: 0xffffff, alpha: 0.75 });
      bodyGfx.poly([-2.1, -5.5, 0.5, -3.2, 1.1, -3.2, -1.5, -5.5]);
      bodyGfx.fill({ color: 0xffffff, alpha: 0.75 });

      // Top wax rim
      bodyGfx.ellipse(0, -13, 2.25, 0.9);
      bodyGfx.fill({ color: cfg.highlight });

      // 2. Visible Charcoal Wick extending from candle top
      bodyGfx.moveTo(0, -13);
      bodyGfx.lineTo(0, -16.5);
      bodyGfx.stroke({ color: 0x221d28, width: 1.2 });
      bodyGfx.circle(0, -16.5, 0.7);
      bodyGfx.fill({ color: 0x111111 });

      candleWrap.addChild(bodyGfx);

      // 3. Flame Graphic placed directly atop the wick tip
      const flame = new Graphics();
      flame.y = -16.5; // Anchor directly on the wick tip

      // Outer warm flame teardrop
      flame.poly([
        0, -8.5,     // tip
        2.6, -4.5,   // right bulge
        1.6, 0,      // right base touching wick
        -1.6, 0,     // left base touching wick
        -2.6, -4.5   // left bulge
      ]);
      flame.fill({ color: 0xf59e0b });

      // Inner glowing core
      flame.poly([
        0, -6.5,
        1.4, -3.5,
        1, 0,
        -1, 0,
        -1.4, -3.5
      ]);
      flame.fill({ color: 0xfef08a });

      // White incandescent center
      flame.circle(0, -2, 1.2);
      flame.fill({ color: 0xffffff });

      // Ambient warm flame aura
      flame.circle(0, -4.5, 5.5);
      flame.fill({ color: 0xffd56b, alpha: 0.32 });

      candleWrap.addChild(flame);
      this.tableContainer.addChild(candleWrap);
      this.candles.push(flame);

      const candleObj = {
        wrap: candleWrap,
        bodyGfx,
        flame,
        cx: cfg.cx,
        cy: cfg.cy,
        isExtinguished: false
      };
      this.candleObjects.push(candleObj);

      candleWrap.on('pointerdown', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        this.extinguishSingleCandle(candleObj);
      });
    });

    // Pulsing "Задуй свечи на торте! 🎂" Badge positioned safely ABOVE the candles (y = -140)
    this.cakePromptBadge = new Container();
    this.cakePromptBadge.y = -140;
    this.cakePromptBadge.eventMode = 'none'; // Unclickable until all candles are blown!

    const badgeBg = new Graphics();
    const bw = 185;
    const bh = 26;
    badgeBg.roundRect(-bw / 2, -bh / 2, bw, bh, 13);
    badgeBg.fill({ color: 0x181224, alpha: 0.94 });
    badgeBg.stroke({ color: 0xffd56b, width: 1.5 });
    this.cakePromptBadge.addChild(badgeBg);

    this.cakeBadgeTxt = new Text({
      text: '✨ Задуй свечи на торте! 🕯️',
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xffecc4
      }
    });
    this.cakeBadgeTxt.anchor.set(0.5);
    this.cakePromptBadge.addChild(this.cakeBadgeTxt);

    this.cakePromptBadge.on('pointerdown', (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (e && e.preventDefault) e.preventDefault();
      if (this.candlesExtinguished) {
        this.openCelebrationModal();
      }
    });

    this.tableContainer.addChild(this.cakePromptBadge);
    this.addChild(this.tableContainer);
  }

  extinguishSingleCandle(candleObj) {
    if (!candleObj || candleObj.isExtinguished) return;

    candleObj.isExtinguished = true;
    candleObj.flame.visible = false;
    soundManager.playCandlePuff();

    // Spawn gentle smoke puff at this candle's wick
    ParticlePool.spawnSplashes(this.particlesContainer, {
      x: this.tableContainer.x + candleObj.cx,
      y: this.tableContainer.y + candleObj.cy - 16.5,
      count: 6,
      color: 0xffffff,
      radiusMax: 3.5,
      spreadX: 12,
      spreadY: 30,
      duration: 750
    });

    // Check remaining candles
    const remaining = this.candleObjects.filter(c => !c.isExtinguished).length;
    if (remaining === 0) {
      this.onAllCandlesExtinguished();
    } else {
      if (this.cakeBadgeTxt) {
        this.cakeBadgeTxt.text = `🕯️ Осталось задуть: ${remaining} ✨`;
      }
    }
  }

  onAllCandlesExtinguished() {
    this.candlesExtinguished = true;
    soundManager.playFanfare();
    soundManager.playChampagneClink();
    soundManager.playSparkle();

    this.spawnCelebrationConfettiBurst(this.tableContainer.x, this.tableContainer.y - 60);

    // Update Olesya's dialogue text to celebratory speech
    if (this.olesya) {
      this.olesya.dialogueText = '«Спасибо вам всем огромное! Вы — мои самые любимые люди на свете! Этот праздник просто невероятный! 🎈🎂✨»';
    }

    // Activate the greeting badge!
    if (this.cakePromptBadge && this.cakeBadgeTxt) {
      this.cakeBadgeTxt.text = '✨ Открыть поздравление! 💌';
      this.cakePromptBadge.eventMode = 'static';
      this.cakePromptBadge.cursor = 'pointer';
    }
  }

  openCelebrationModal() {
    if (!this.candlesExtinguished) return; // Strict lock!
    soundManager.playFanfare();
    soundManager.playSparkle();
    setTimeout(() => {
      if (window.birthdayModal) {
        window.birthdayModal.show();
      }
    }, 80);
  }

  handleOlesyaClick(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    // Olesya bounce jump animation
    if (this.olesya.jumpTween) {
      this.olesya.jumpTween.stop();
      this.olesya.jumpTween = null;
    }
    this.olesya.bodyContainer.y = -this.olesya.charHeight;

    this.olesya.jumpTween = new TWEEN.Tween(this.olesya.bodyContainer)
      .to({ y: -this.olesya.charHeight - 14 }, 140)
      .yoyo(true)
      .repeat(1)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.olesya.bodyContainer.y = -this.olesya.charHeight;
        this.olesya.jumpTween = null;
      })
      .onStop(() => {
        this.olesya.bodyContainer.y = -this.olesya.charHeight;
        this.olesya.jumpTween = null;
      })
      .start();

    if (!this.candlesExtinguished) {
      // Candles NOT yet blown -> speak hint dialogue bubble, NEVER open modal!
      soundManager.playTap();
      const globalPos = this.olesya.toGlobal({ x: 0, y: -this.olesya.charHeight - 24 + (this.olesya.badgeOffsetY || 0) });
      DialogBubble.show(
        'Олеся',
        '«Сначала нужно задуть все свечи на торте и загадать самое заветное желание! 🎂🕯️✨»',
        globalPos.x,
        globalPos.y
      );
    } else {
      // All candles blown -> open congratulation letter modal!
      this.openCelebrationModal();
    }
  }

  initAllCharactersLineup() {
    // ==========================================
    // 1. LEFT OF OLESYA: FAMILY & PASHKA
    // ==========================================

    // Dad (Папа, рост 1.70 м): Stepped forward 1 step (y = 484)
    this.dad = new Character({
      name: 'dad',
      speakerTitle: 'Папа',
      dialogueText: '«Доченька, горжусь тобой невероятно! Прекрасный врач и самый светлый человек на свете! С 23-летием! 💖»',
      x: 265,
      y: 484,
      width: 72,
      height: 140,
      textureUrl: '/assets/characters/scene08_dad.png'
    });

    // Mom (Мама, рост 1.68 м): Stepped forward 1 step (y = 492)
    this.mom = new Character({
      name: 'mom',
      speakerTitle: 'Мама',
      dialogueText: '«Моя звёздочка, с 23-летием! Пусть твоя улыбка освещает мир, а все мечты сбываются! 🌸🎂»',
      x: 320,
      y: 492,
      width: 69,
      height: 138,
      textureUrl: '/assets/characters/scene08_mom.png'
    });

    // Serega (Серёга, рост 1.75 м - скорректирован чуть выше Папы и Янки): Stepped forward 1 step (y = 484)
    this.serega = new Character({
      name: 'serega',
      speakerTitle: 'Серёга',
      dialogueText: '«Олеся, с днём рождения! Мы с Янкой от всей души поздравляем тебя! Сил, здоровья и самых крутых успехов во всём! 🎉🥳»',
      x: 370,
      y: 484,
      width: 70,
      height: 144,
      badgeOffsetY: -24,
      textureUrl: '/assets/characters/scene08_serega.png'
    });

    // Yanka (Янка, рост 1.70 м - наравне с Папой): Stepped forward 1 step (y = 496)
    this.sister = new Character({
      name: 'sister',
      speakerTitle: 'Янка',
      dialogueText: '«Сестрёнка, ты у меня самая крутая и самая любимая! С днём рождения! 🎉💖»',
      x: 412,
      y: 496,
      width: 68,
      height: 140,
      textureUrl: '/assets/characters/scene08_sister.png'
    });

    // Pashka (Пашка, рост 1.90 м - самый высокий): Stepped forward 1 step (y = 490)
    this.pashka = new Character({
      name: 'pashka',
      speakerTitle: 'Пашка',
      dialogueText: '«Любимая моя Лесечка! С 23-летием! Ты моё самое большое счастье. Я бесконечно люблю тебя и всегда рядом! 💖🎂»',
      x: 458,
      y: 490,
      width: 76,
      height: 156,
      badgeOffsetY: -24,
      textureUrl: '/assets/characters/scene08_pashka.png'
    });

    // ==========================================
    // 2. CENTER: HEROINE OLESYA (MAIN VISUAL ACCENT)
    // ==========================================

    // Olesya (Олеся ✨, рост 1.60 м): Center (x = 512), STEPPED FORWARD 2 STEPS (y = 518) to foreground!
    this.olesya = new Character({
      name: 'olesya',
      speakerTitle: 'Олеся',
      dialogueText: '«Сначала нужно задуть все свечи на торте и загадать самое заветное желание! 🎂🕯️✨»',
      x: 512,
      y: 518,
      width: 78,
      height: 134,
      textureUrl: '/assets/characters/scene08_olesya.png'
    });

    // Custom click handler: hint speech before candles extinguished; modal unlock after
    this.olesya.onClick = (e) => this.handleOlesyaClick(e);

    // ==========================================
    // 3. RIGHT OF OLESYA: BEST GIRLFRIENDS
    // ==========================================

    // Liza (Лиза, рост 1.65 м): Stepped forward 1 step (y = 490)
    this.liza = new Character({
      name: 'liza',
      speakerTitle: 'Лиза',
      dialogueText: '«Олесечка, с 23-летием! Лучшему стоматологу — голливудских улыбок и огромного счастья! 🥼🦷✨»',
      x: 565,
      y: 490,
      width: 68,
      height: 136,
      textureUrl: '/assets/characters/scene08_liza.png'
    });

    // Kristina (Кристина, рост 1.65 м): Stepped forward 1 step (y = 496)
    this.kristina = new Character({
      name: 'kristina',
      speakerTitle: 'Кристина',
      dialogueText: '«За нашу Олесю! Пусть каждый день приносит радость и профессиональное вдохновение! 💖🎉»',
      x: 610,
      y: 496,
      width: 66,
      height: 136,
      badgeOffsetY: -34,
      textureUrl: '/assets/characters/scene08_kristina.png'
    });

    // Tanya (Таня, рост 1.65 м): Stepped forward 1 step (y = 484)
    this.tanya = new Character({
      name: 'tanya',
      speakerTitle: 'Таня',
      dialogueText: '«Ура имениннице! Самый заботливый врач и лучшая подруга на свете! 🦷💖»',
      x: 650,
      y: 484,
      width: 66,
      height: 136,
      badgeOffsetY: 6,
      textureUrl: '/assets/characters/scene08_tanya.png'
    });

    // Anya (Аня, рост 1.65 м - уменьшена для гармонии с подругами): Stepped forward 1 step (y = 484)
    this.anya = new Character({
      name: 'anya',
      speakerTitle: 'Аня',
      dialogueText: '«С днём рождения, коллега! Впереди только великие свершения и победы! 🩺🌟»',
      x: 690,
      y: 484,
      width: 66,
      height: 136,
      badgeOffsetY: -28,
      textureUrl: '/assets/characters/scene08_anya.png'
    });

    // Add back row first, then mid row, front-mid row, and forefront (Olesya) for flawless depth layering
    const backRow = [this.dad, this.serega, this.tanya, this.anya];
    const midRow = [this.mom, this.pashka, this.liza];
    const frontMidRow = [this.sister, this.kristina];
    const foreFront = [this.olesya];

    backRow.forEach(c => this.addChild(c));
    midRow.forEach(c => this.addChild(c));
    frontMidRow.forEach(c => this.addChild(c));
    foreFront.forEach(c => this.addChild(c));

    this.characters.push(
      this.dad, this.mom, this.serega, this.sister,
      this.pashka, this.olesya,
      this.liza, this.kristina, this.tanya, this.anya
    );
  }

  onEnter() {
    super.onEnter();
    soundManager.setBgmTrack('celebration');
    this.candlesExtinguished = false;
    this.candles.forEach(flame => {
      flame.visible = true;
    });
    if (this.candleObjects) {
      this.candleObjects.forEach(c => {
        c.isExtinguished = false;
        c.flame.visible = true;
      });
    }
    if (this.cakeBadgeTxt) {
      this.cakeBadgeTxt.text = '✨ Задуй свечи на торте! 🕯️';
    }
    if (this.cakePromptBadge) {
      this.cakePromptBadge.eventMode = 'none';
      this.cakePromptBadge.cursor = 'default';
    }
    if (this.olesya) {
      this.olesya.dialogueText = '«Сначала нужно задуть все свечи на торте и загадать самое заветное желание! 🎂🕯️✨»';
    }
  }

  onLeave() {
    super.onLeave();
    soundManager.setBgmTrack('nostalgic');
  }

  extinguishCandles() {
    this.candlesExtinguished = true;
    if (this.candleObjects) {
      this.candleObjects.forEach(c => {
        c.isExtinguished = true;
        c.flame.visible = false;
      });
    }
    this.candles.forEach(flame => {
      flame.visible = false;
    });
    if (this.cakeBadgeTxt) {
      this.cakeBadgeTxt.text = '✨ Свечи задуты! С ДР! 💖';
    }

    // Spawn gentle wisps of white smoke from each candle wick
    if (this.candleObjects) {
      this.candleObjects.forEach(c => {
        ParticlePool.spawnSplashes(this.particlesContainer, {
          x: this.tableContainer.x + c.cx,
          y: this.tableContainer.y + c.cy - 16.5,
          count: 5,
          color: 0xffffff,
          radiusMax: 3.8,
          spreadX: 12,
          spreadY: 35,
          duration: 850
        });
      });
    }

    // Spurt celebratory hearts & emojis via ParticlePool
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x: this.tableContainer.x,
      y: this.tableContainer.y - 60,
      count: 20,
      symbols: ['💖', '🎂', '✨', '🌸', '🦷'],
      spreadX: 80,
      spreadY: 80,
      duration: 1100
    });
  }

  spawnCelebrationConfettiBurst(x, y) {
    ParticlePool.spawnConfettiBurst(this.particlesContainer, {
      x,
      y,
      count: 30,
      spreadX: 220,
      spreadY: 130,
      duration: 850
    });
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y: y - 20,
      count: 10,
      symbols: ['🎉', '✨', '💖', '⭐', '🦷'],
      spreadX: 120,
      spreadY: 80,
      duration: 1100
    });
  }

  spawnHeart(x, y) {
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y,
      count: 1,
      symbols: ['💖', '✨'],
      spreadX: 25,
      spreadY: 55,
      duration: 800
    });
  }

  update(delta) {
    super.update(delta);
    this.candleTimer += delta * 0.08;
    this.characters.forEach(c => c.update(delta));

    // Candle flame animation (if not extinguished)
    if (!this.candlesExtinguished) {
      this.candles.forEach((flame, idx) => {
        const flicker = 0.85 + Math.sin(this.candleTimer * 3 + idx * 1.5) * 0.2;
        flame.scale.y = flicker;
        flame.scale.x = 1 + Math.sin(this.candleTimer * 4 + idx) * 0.15;
      });
    }

    // Cake prompt badge gentle bobbing safely above candles (candles at y = -95)
    if (this.cakePromptBadge) {
      this.cakePromptBadge.y = -138 + Math.sin(this.candleTimer * 2) * 2;
    }

    // Ambient floating golden birthday sparkles
    if (Math.random() < 0.12) {
      const sx = 440 + Math.random() * 144;
      const sy = 340 + Math.random() * 70;
      this.spawnHeart(sx, sy);
    }

    // Gentle inviting sparkle hint on unblown candles (every ~3.5 seconds)
    if (!this.candlesExtinguished && this.candleObjects) {
      this.candleHintTimer = (this.candleHintTimer || 0) + delta;
      if (this.candleHintTimer > 210) {
        this.candleHintTimer = 0;
        const litCandles = this.candleObjects.filter(c => !c.isExtinguished);
        if (litCandles.length > 0) {
          const pick = litCandles[Math.floor(Math.random() * litCandles.length)];
          ParticlePool.spawnTextBurst(this.particlesContainer, {
            x: this.tableContainer.x + pick.cx,
            y: this.tableContainer.y + pick.cy - 18,
            count: 1,
            symbols: ['✨'],
            spreadX: 10,
            spreadY: 22,
            duration: 750
          });
        }
      }
    }
  }
}
