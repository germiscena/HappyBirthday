import { Container, Graphics, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene05_MedicalUniversity extends BaseScene {
  constructor() {
    super('scene05', 'Витебский государственный медицинский университет (18 лет)');
    this.characters = [];
    this.sparkles = [];
    this.sparkleTimer = 0;
  }

  async init() {
    // 1. University Building Architecture & Sky (Grodno Medical University)
    await this.initUniversityBuilding();

    // 2. Circular Granite Fountain with Hygieia Statue
    this.initFountain();

    // 4. Five Medical Student Girlfriends in White Coats & Caps
    this.initMedicalStudents();
  }

  async initUniversityBuilding() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene05_university.jpg'),
        Assets.load('/assets/characters/scene05_tanya.png'),
        Assets.load('/assets/characters/scene05_anya.png'),
        Assets.load('/assets/characters/scene05_olesya.png'),
        Assets.load('/assets/characters/scene05_liza.png'),
        Assets.load('/assets/characters/scene05_kristina.png'),
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x8a7664 });
      this.parallaxContainer.addChild(bg);
    }
  }

  initFountain() {
    this.fountainContainer = new InteractiveObject({
      x: 160,
      y: 445,
      hitArea: new Rectangle(-110, -75, 220, 125),
      hapticType: 'medium',
      bounceScale: 1.05,
      bounceDuration: 120,
      soundEffect: () => {
        soundManager.playFountainSplash();
        soundManager.playSparkle();
      },
      dialogTitle: 'Фонтан ВГМУ «Гигея» 🪙',
      dialogText: '«Студенческая примета: бросить монетку в фонтан Гигеи у главного корпуса ВГМУ перед сессией на удачу! 🪙💦»',
      onTap: () => {
        ParticlePool.spawnSplashes(this.particlesContainer, {
          x: this.fountainContainer.x,
          y: this.fountainContainer.y - 40,
          count: 14,
          color: 0xffffff,
          radiusMax: 4,
          spreadX: 80,
          spreadY: 60,
        });
        this.spawnMedBurst(this.fountainContainer.x, this.fountainContainer.y - 60, 8, ['🪙', '💦', '✨', '💧']);
      },
    });

    this.addChild(this.fountainContainer);
  }

  initMedicalStudents() {
    this.studentsLayer = new Container();
    this.addChild(this.studentsLayer);

    // 5 Medical student girlfriends celebrating together in front of university (scaled 150%)
    // 1. TANYA (x: 335)
    this.tanya = new Character({
      name: 'tanya',
      charType: 'tanya_med',
      speakerTitle: 'Таня',
      dialogueText: '«Ура, девочки! Теперь мы официально будущие врачи! Впереди 5 лет учёбы, но вместе нам ничего не страшно! 💉📚»',
      x: 335,
      y: 472,
      width: 66,
      height: 144,
      textureUrl: '/assets/characters/scene05_tanya.png',
    });
    this.setupMedStudentClick(this.tanya);
    this.studentsLayer.addChild(this.tanya);
    this.characters.push(this.tanya);

    // 2. ANYA (x: 405)
    this.anya = new Character({
      name: 'anya',
      charType: 'anya_med',
      speakerTitle: 'Аня',
      dialogueText: '«Олеська, мы сделали это! Белый халат сидит на тебе просто идеально! Побежали на первую лекцию по анатомии! 👩‍⚕️❤️»',
      x: 405,
      y: 472,
      width: 66,
      height: 144,
      badgeOffsetY: -20,
      textureUrl: '/assets/characters/scene05_anya.png',
    });
    this.setupMedStudentClick(this.anya);
    this.studentsLayer.addChild(this.anya);
    this.characters.push(this.anya);

    // 3. OLESYA (in the center, x: 480)
    this.olesya = new Character({
      name: 'olesya',
      charType: 'olesya_med',
      speakerTitle: 'Олеся 🩺',
      dialogueText: '«Мы поступили в Витебский государственный медицинский университет! Белые халаты, шапочки, первая лекция по анатомии... Наша неразлучная пятёрка готова спасать жизни! 🩺✨»',
      x: 480,
      y: 472,
      width: 76,
      height: 162,
      textureUrl: '/assets/characters/scene05_olesya.png',
    });
    this.setupMedStudentClick(this.olesya, true);
    this.studentsLayer.addChild(this.olesya);
    this.characters.push(this.olesya);

    // 4. LIZA (x: 555)
    this.liza = new Character({
      name: 'liza',
      charType: 'liza_med',
      speakerTitle: 'Лиза',
      dialogueText: '«Столько волнения было на вступительных, а теперь мы здесь, у нашего любимого ВГМУ у фонтана! 🩺🎉»',
      x: 555,
      y: 472,
      width: 66,
      height: 144,
      badgeOffsetY: -20,
      textureUrl: '/assets/characters/scene05_liza.png',
    });
    this.setupMedStudentClick(this.liza);
    this.studentsLayer.addChild(this.liza);
    this.characters.push(this.liza);

    // 5. KRISTINA (x: 625)
    this.kristina = new Character({
      name: 'kristina',
      charType: 'kristina_med',
      speakerTitle: 'Кристина',
      dialogueText: '«Самая лучшая группа и самые классные подруги! Наша медицинская банда в сборе! 💊✨»',
      x: 625,
      y: 472,
      width: 66,
      height: 144,
      textureUrl: '/assets/characters/scene05_kristina.png',
    });
    this.setupMedStudentClick(this.kristina);
    this.studentsLayer.addChild(this.kristina);
    this.characters.push(this.kristina);

    // Floating celebratory medical hearts/sparkles container
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }

  setupMedStudentClick(char, isOlesya = false) {
    const orig = char.onClick.bind(char);
    char.onClick = (e) => {
      soundManager.playSparkle();
      const symbols = isOlesya ? ['🩺', '✨', '💖', '💊', '👩‍⚕️', '⭐'] : ['🩺', '✨', '📚', '💉', '💖'];
      this.spawnMedBurst(char.x, char.y - 75, 14, symbols);
      orig(e);
    };
  }

  spawnMedBurst(x, y, count = 12, symbols = ['🩺', '✨', '💊', '💖']) {
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 55,
      spreadY: 65,
      duration: 1200,
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

    // Ambient sparkles around the medical student group
    this.sparkleTimer += delta;
    if (this.sparkleTimer > 60) {
      this.sparkleTimer = 0;
      this.spawnMedBurst(478, 380, 1, ['✨', '🩺', '💖']);
    }
  }
}
