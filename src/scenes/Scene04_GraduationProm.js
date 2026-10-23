import { Container, Graphics, Text, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene04_GraduationProm extends BaseScene {
  constructor() {
    super('scene04', 'Школьный выпускной (17 лет)');
    this.characters = [];
    this.confetti = [];
    this.sparkles = [];
    this.sparkleTimer = 0;
  }

  async init() {
    // 1. Auditorium Hall Background & Stage
    await this.initStageScenery();

    // 2. Classmates / Crowd on Stage (Массовка выпускников)
    this.initClassmates();

    // 3. Central Spotlight on Olesya
    this.initSpotlight();

    // 4. Heroine: Olesya in Radiant Emerald Green Gown
    this.initOlesya();

    // 5. Foreground Seated Audience (Перед сценой сидящие в зале зрители)
    this.initSeatedAudience();

    // 6. Confetti & Sparkles
    this.initConfetti();
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }

  async initStageScenery() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene04_prom.jpg'),
        Assets.load('/assets/characters/scene04_olesya.png'),
        Assets.load('/assets/characters/scene04_classmate_m1.png'),
        Assets.load('/assets/characters/scene04_classmate_m2.png'),
        Assets.load('/assets/characters/scene04_classmate_f1.png'),
        Assets.load('/assets/characters/scene04_classmate_f2.png'),
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x1d1426 });
      this.parallaxContainer.addChild(bg);
    }
  }

  initSpotlight() {
    const spot = new Graphics();

    // Soft volumetric spotlight beam from top rig focused on Olesya in center
    spot.poly([512, 0, 417, 415, 607, 415]);
    spot.fill({ color: 0xfff5c2, alpha: 0.14 });

    // Inner brighter core beam
    spot.poly([512, 0, 462, 415, 562, 415]);
    spot.fill({ color: 0xfffae0, alpha: 0.1 });

    // Shimmering illuminated golden-emerald halo on the stage floor under Olesya
    spot.ellipse(512, 412, 80, 19);
    spot.fill({ color: 0xfff2ba, alpha: 0.32 });
    spot.ellipse(512, 412, 54, 13);
    spot.fill({ color: 0x2ed185, alpha: 0.28 });
    spot.ellipse(512, 412, 30, 8);
    spot.fill({ color: 0xffffff, alpha: 0.45 });

    this.addChild(spot);
  }

  initClassmates() {
    this.stageCrowdLayer = new Container();
    this.addChild(this.stageCrowdLayer);

    // Male graduate (left side, balanced spread x: 312)
    const m1 = new Character({
      name: 'classmate_m1',
      charType: 'classmate_m',
      speakerTitle: 'Одноклассник',
      dialogueText: '«Олеся, ты сегодня просто королева вечера! Какое потрясающее платье! Поздравляем с выпуском! 🎓🎉»',
      x: 312,
      y: 405,
      width: 46,
      height: 104,
      badgeOffsetY: -24,
      textureUrl: '/assets/characters/scene04_classmate_m1.png',
    });
    this.setupCharacterClick(m1);
    this.stageCrowdLayer.addChild(m1);
    this.characters.push(m1);

    // Female graduate (left side, balanced spread x: 412)
    const f1 = new Character({
      name: 'classmate_f1',
      charType: 'classmate_f',
      speakerTitle: 'Подруга',
      dialogueText: '«Олеська, изумрудный цвет тебе безумно идёт! Мы закончили школу, ура! В добрый путь нам всем! 💚✨»',
      x: 412,
      y: 405,
      width: 44,
      height: 98,
      textureUrl: '/assets/characters/scene04_classmate_f1.png',
    });
    this.setupCharacterClick(f1);
    this.stageCrowdLayer.addChild(f1);
    this.characters.push(f1);

    // Female graduate (right side, balanced spread x: 612)
    const f2 = new Character({
      name: 'classmate_f2',
      charType: 'classmate_f',
      speakerTitle: 'Одноклассница',
      dialogueText: '«Не верится, что 11 лет пролетели так быстро! Олеся, ты сияешь ярче всех софитов! 🌟»',
      x: 612,
      y: 405,
      width: 44,
      height: 98,
      textureUrl: '/assets/characters/scene04_classmate_f2.png',
    });
    this.setupCharacterClick(f2);
    this.stageCrowdLayer.addChild(f2);
    this.characters.push(f2);

    // Male graduate (right side, balanced spread x: 712)
    const m2 = new Character({
      name: 'classmate_m2',
      charType: 'classmate_m',
      speakerTitle: 'Выпускник',
      dialogueText: '«Ура-а-а, аттестаты в руках! Впереди взрослая жизнь и университет! Зажигать так зажигать! 🎓🥂»',
      x: 712,
      y: 405,
      width: 46,
      height: 104,
      badgeOffsetY: -24,
      textureUrl: '/assets/characters/scene04_classmate_m2.png',
    });
    this.setupCharacterClick(m2);
    this.stageCrowdLayer.addChild(m2);
    this.characters.push(m2);
  }

  setupCharacterClick(char) {
    const orig = char.onClick.bind(char);
    char.onClick = (e) => {
      soundManager.playApplause();
      this.spawnCelebrationBurst(char.x, char.y - 70, 10, ['🎉', '🎓', '✨', '👏']);
      orig(e);
    };
  }

  initOlesya() {
    this.olesyaLayer = new Container();
    this.addChild(this.olesyaLayer);

    // OLESYA IN RADIANT EMERALD GREEN DRESS (Positioned right in center x: 512)
    this.olesya = new Character({
      name: 'olesya_prom',
      charType: 'olesya_prom',
      speakerTitle: 'Олеся ✨',
      dialogueText: '«Мой школьный выпускной в любимом изумрудно-зелёном платье! Столько волнения, радости и счастливых слёз... Впереди целый мир и поступление в медицинский! 💚✨»',
      x: 512,
      y: 405,
      width: 48,
      height: 106,
      textureUrl: '/assets/characters/scene04_olesya.png',
    });

    const origClick = this.olesya.onClick.bind(this.olesya);
    this.olesya.onClick = (e) => {
      soundManager.playFanfare();
      this.spawnCelebrationBurst(512, 340, 18, ['✨', '💚', '⭐', '🌟', '💖', '👗']);
      origClick(e);
    };

    this.olesyaLayer.addChild(this.olesya);
    this.characters.push(this.olesya);
  }

  initSeatedAudience() {
    // Rows of seated people watching the stage from the hall in foreground
    this.audienceContainer = new Container();
    this.audienceContainer.y = 420;
    this.audienceContainer.eventMode = 'static';
    this.audienceContainer.cursor = 'pointer';

    const ag = new Graphics();

    // Dark auditorium hall floor
    ag.rect(0, 0, this.virtualWidth, 120);
    ag.fill({ color: 0x110c19, alpha: 0.96 });

    // Seat row 2 backrest (plush velvet roll with pixel-art trim)
    ag.rect(0, 24, this.virtualWidth, 2);
    ag.fill({ color: 0x3d172a }); // top highlight rail
    ag.rect(0, 26, this.virtualWidth, 16);
    ag.fill({ color: 0x240d1c }); // velvet body
    ag.rect(0, 42, this.virtualWidth, 2);
    ag.fill({ color: 0x120610 }); // crease shadow

    // Row 2 spectators (middle ground, authentic stepped 16-bit pixel silhouettes)
    const row2Hairs = [0x1e1822, 0x3d2719, 0x61442a, 0xba8c38, 0x7a797d, 0x2b1b17];
    const row2Suits = [0x222633, 0x38283f, 0x3e2329, 0x1e2e23, 0x1c1e28, 0x2d2432];

    for (let x = 24; x < this.virtualWidth; x += 42) {
      const variant = Math.floor(x * 7) % 3;
      const hairCol = row2Hairs[Math.floor(x * 5) % row2Hairs.length];
      const suitCol = row2Suits[Math.floor(x * 3) % row2Suits.length];

      // Stepped pixel shoulders
      ag.rect(x - 14, 22, 28, 14);
      ag.fill({ color: suitCol });
      ag.rect(x - 11, 18, 22, 5);
      ag.fill({ color: suitCol });
      ag.rect(x - 5, 15, 10, 4); // collar
      ag.fill({ color: suitCol });

      // Stage ambient rim highlight across shoulders
      ag.rect(x - 11, 17, 22, 1);
      ag.fill({ color: 0x4e4652, alpha: 0.5 });

      // Pixel hairstyles (stepped blocks)
      if (variant === 0) {
        // Short neat hair
        ag.rect(x - 7, 6, 14, 10);
        ag.fill({ color: hairCol });
        ag.rect(x - 5, 4, 10, 2);
        ag.fill({ color: hairCol });
        ag.rect(x - 3, 3, 6, 1);
        ag.fill({ color: 0x7a6d68, alpha: 0.4 });
      } else if (variant === 1) {
        // Updo / bun
        ag.rect(x - 4, 1, 8, 5); // top knot
        ag.fill({ color: hairCol });
        ag.rect(x - 7, 5, 14, 11);
        ag.fill({ color: hairCol });
      } else {
        // Bob cut
        ag.rect(x - 8, 5, 16, 12);
        ag.fill({ color: hairCol });
        ag.rect(x - 6, 3, 12, 2);
        ag.fill({ color: hairCol });
        ag.rect(x - 9, 12, 18, 5);
        ag.fill({ color: hairCol });
      }
    }

    // Seat row 1 backrest (closest foreground)
    ag.rect(0, 68, this.virtualWidth, 2);
    ag.fill({ color: 0x481b32 }); // highlight rail
    ag.rect(0, 70, this.virtualWidth, 20);
    ag.fill({ color: 0x1f0b18 }); // velvet body
    ag.rect(0, 90, this.virtualWidth, 3);
    ag.fill({ color: 0x0c040d }); // shadow crease

    // Row 1 spectators (closest foreground, larger stepped pixel silhouettes)
    const row1Hairs = [0x16131c, 0x331e13, 0x4f3620, 0xa37b2d, 0x6e6e73, 0x261714];
    const row1Suits = [0x1a1c26, 0x2b1e32, 0x331c22, 0x16241a, 0x151620, 0x231a29];

    for (let x = 18; x < this.virtualWidth; x += 52) {
      const idx = Math.floor(x * 11);
      const variant = idx % 4;
      const hairCol = row1Hairs[idx % row1Hairs.length];
      const suitCol = row1Suits[(idx * 3) % row1Suits.length];

      // Stepped shoulders
      ag.rect(x - 20, 72, 40, 26);
      ag.fill({ color: suitCol });
      ag.rect(x - 17, 66, 34, 7);
      ag.fill({ color: suitCol });
      ag.rect(x - 14, 60, 28, 7);
      ag.fill({ color: suitCol });
      ag.rect(x - 6, 55, 12, 6); // neck / collar
      ag.fill({ color: suitCol });

      // Stage ambient rim light
      ag.rect(x - 15, 59, 30, 2);
      ag.fill({ color: 0x5c5260, alpha: 0.45 });

      // Pixel hairstyles
      if (variant === 0) {
        // Classic short hair
        ag.rect(x - 9, 42, 18, 14);
        ag.fill({ color: hairCol });
        ag.rect(x - 7, 39, 14, 3);
        ag.fill({ color: hairCol });
        ag.rect(x - 4, 37, 8, 2);
        ag.fill({ color: hairCol });
        ag.rect(x - 5, 36, 10, 1);
        ag.fill({ color: 0x8a7f78, alpha: 0.45 });
      } else if (variant === 1) {
        // Elegant updo
        ag.rect(x - 5, 34, 10, 7); // bun
        ag.fill({ color: hairCol });
        ag.rect(x - 9, 41, 18, 15);
        ag.fill({ color: hairCol });
        ag.rect(x - 7, 39, 14, 3);
        ag.fill({ color: hairCol });
      } else if (variant === 2) {
        // Wavy shoulder-length hair
        ag.rect(x - 10, 40, 20, 16);
        ag.fill({ color: hairCol });
        ag.rect(x - 7, 37, 14, 3);
        ag.fill({ color: hairCol });
        ag.rect(x - 12, 51, 24, 12);
        ag.fill({ color: hairCol });
      } else {
        // Side parting
        ag.rect(x - 9, 42, 18, 14);
        ag.fill({ color: hairCol });
        ag.rect(x - 8, 39, 16, 3);
        ag.fill({ color: hairCol });
        ag.rect(x - 4, 38, 8, 2);
        ag.fill({ color: 0x3d302a });
      }

      // Atmospheric spectator gestures
      if (idx % 5 === 1) {
        // Stepped pixel clapping hands
        ag.rect(x - 15, 50, 6, 8);
        ag.fill({ color: 0xe0b99f });
        ag.rect(x - 14, 48, 4, 2);
        ag.fill({ color: 0xe0b99f });
        ag.rect(x + 9, 50, 6, 8);
        ag.fill({ color: 0xe0b99f });
        ag.rect(x + 10, 48, 4, 2);
        ag.fill({ color: 0xe0b99f });
      } else if (idx % 5 === 3) {
        // Parent filming the stage on phone
        ag.rect(x - 8, 52, 5, 7);
        ag.fill({ color: 0xd8af94 });
        ag.rect(x + 3, 52, 5, 7);
        ag.fill({ color: 0xd8af94 });
        // Phone body
        ag.rect(x - 5, 44, 10, 14);
        ag.fill({ color: 0x1f2228 });
        // Glowing camera screen
        ag.rect(x - 4, 45, 8, 10);
        ag.fill({ color: 0x5dade2, alpha: 0.9 });
        ag.rect(x - 2, 49, 4, 4);
        ag.fill({ color: 0x2ed185 }); // emerald dress on screen
      }
    }

    // Floating pill hint: «Зрительный зал (нажмите для аплодисментов)»
    const hintBadge = new Graphics();
    hintBadge.roundRect(this.virtualWidth / 2 - 130, 88, 260, 22, 11);
    hintBadge.fill({ color: 0x181424, alpha: 0.88 });
    hintBadge.stroke({ color: 0xffd56b, alpha: 0.6, width: 1 });
    ag.addChild(hintBadge);

    const hintText = new Text({
      text: '👏 Зрители и родители аплодируют',
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xffebad,
      },
    });
    hintText.anchor.set(0.5);
    hintText.x = this.virtualWidth / 2;
    hintText.y = 99;

    this.audienceContainer.addChild(ag);
    this.audienceContainer.addChild(hintText);

    // Clicking anywhere in the audience triggers applause
    this.audienceContainer.on('pointerdown', (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      soundManager.playApplause();
      this.spawnCelebrationBurst(this.virtualWidth / 2, 435, 12, ['👏', '💖', '💐', '✨']);

      const globalPos = this.audienceContainer.toGlobal({ x: this.virtualWidth / 2, y: 15 });
      DialogBubble.show('Родители и учителя 👏', '«Олеся, какая ты красавица! Гордимся нашими выпускниками, пусть всё задуманное сбудется! 💖🎓»', globalPos.x, globalPos.y);
    });

    // this.addChild(this.audienceContainer);
  }

  initConfetti() {
    this.confettiContainer = new Container();
    this.addChild(this.confettiContainer);

    const colors = [0xffd56b, 0x16824f, 0x2ed185, 0xffffff, 0xc4272f, 0xd4a037];
    for (let i = 0; i < 40; i++) {
      const piece = new Graphics();
      const w = Math.random() * 5 + 3;
      const h = Math.random() * 5 + 3;
      piece.rect(-w / 2, -h / 2, w, h);
      piece.fill({ color: colors[Math.floor(Math.random() * colors.length)] });
      piece.x = Math.random() * this.virtualWidth;
      piece.y = Math.random() * this.virtualHeight;
      this.confettiContainer.addChild(piece);

      this.confetti.push({
        gfx: piece,
        vy: Math.random() * 0.9 + 0.4,
        vx: (Math.random() - 0.5) * 0.6,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      });
    }
  }

  spawnKissBurst(x, y, count = 10, symbols = ['💋', '😘', '✨', '💖', '💚']) {
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 55,
      spreadY: 70,
      duration: 1300,
    });
  }

  spawnCelebrationBurst(x, y, count = 14, symbols = ['✨', '💚', '⭐', '🌟', '🎉']) {
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 60,
      spreadY: 70,
      duration: 1300,
    });
  }

  onEnter() {
    super.onEnter();
  }

  onLeave() {
    super.onLeave();
  }

  update(delta) {
    super.update(delta);
    this.characters.forEach((c) => c.update(delta));

    // Update falling festive confetti
    this.confetti.forEach((p) => {
      p.gfx.y += p.vy * delta;
      p.gfx.x += p.vx * delta;
      p.gfx.rotation += p.rotSpeed * delta;

      if (p.gfx.y > this.virtualHeight) {
        p.gfx.y = -10;
        p.gfx.x = Math.random() * this.virtualWidth;
      }
    });

    // Ambient emerald & gold sparkles around Olesya in center
    this.sparkleTimer += delta;
    if (this.sparkleTimer > 50) {
      this.sparkleTimer = 0;
      this.spawnCelebrationBurst(512, 360, 1, ['✨', '💚', '⭐']);
    }
  }
}
