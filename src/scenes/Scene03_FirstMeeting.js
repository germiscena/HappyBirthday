import { Container, Graphics, Text, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';

export class Scene03_FirstMeeting extends BaseScene {
  constructor() {
    super('scene03', 'Судьбоносная встреча (16 лет)');
    this.characters = [];
    this.snowflakes = [];
    this.ambientHearts = [];
    this.heartsContainer = null;
    this.heartSpawnTimer = 0;
  }

  async init() {
    // 1. Outside winter sky & school corridor interior
    await this.initCorridorArchitecture();
    this.initSnowflakes();

    // 3. Romantic hearts particle layer
    this.heartsContainer = new Container();
    this.addChild(this.heartsContainer);

    // 4. Characters layer (Pashka & Lesya in warm embrace)
    this.entityLayer = new Container();
    this.addChild(this.entityLayer);

    // PASHKA (Tall high school boy ~1.90m scale, scaled 2x to height 252px)
    this.pashka = new Character({
      name: 'pashka',
      charType: 'pashka',
      speakerTitle: 'Пашка',
      dialogueText: '«Школьная перемена... а для меня весь мир замер. Только ты, твоя улыбка и тепло твоих объятий. Я влюбился с первого взгляда! ❤️»',
      x: 420,
      y: 472,
      width: 104,
      height: 252,
      textureUrl: '/assets/characters/scene03_pashka.png'
    });

    const origPashkaClick = this.pashka.onClick.bind(this.pashka);
    this.pashka.onClick = (e) => {
      soundManager.playRomanticChime();
      this.spawnKissBurst(420, 260, 12);
      origPashkaClick(e);
    };
    this.entityLayer.addChild(this.pashka);
    this.characters.push(this.pashka);

    // LESYA (16 years old, scaled 2x to height 188px)
    this.lesya = new Character({
      name: 'lesya_16',
      charType: 'lesya_16',
      speakerTitle: 'Леся',
      dialogueText: '«Шумный школьный коридор, звенит звонок... А в твоих объятиях так уютно и тепло, и кажется, что мы здесь одни на всей планете! Мой любимый Пашка... 💖»',
      x: 510,
      y: 472,
      width: 88,
      height: 188,
      textureUrl: '/assets/characters/scene03_lesya.png'
    });

    const origLesyaClick = this.lesya.onClick.bind(this.lesya);
    this.lesya.onClick = (e) => {
      soundManager.playRomanticChime();
      this.spawnKissBurst(510, 310, 12);
      origLesyaClick(e);
    };
    this.entityLayer.addChild(this.lesya);
    this.characters.push(this.lesya);

    // 5. Interactive School Bell on wall
    this.initSchoolBell();
  }



  initSnowflakes() {
    this.snowContainer = new Container();
    this.addChild(this.snowContainer);

    // Snow gently falling outside the right-side corridor windows (x: 560..980, y: 50..370)
    for (let i = 0; i < 26; i++) {
      const flake = new Graphics();
      const radius = Math.random() * 2.0 + 1.0;
      flake.circle(0, 0, radius);
      flake.fill({ color: 0xffffff, alpha: Math.random() * 0.55 + 0.35 });
      flake.x = 560 + Math.random() * 420;
      flake.y = 50 + Math.random() * 320;
      this.snowContainer.addChild(flake);
      this.snowflakes.push({
        gfx: flake,
        vy: Math.random() * 0.45 + 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
        wobbleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  async initCorridorArchitecture() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene03_corridor.jpg'),
        Assets.load('/assets/characters/scene03_pashka.png'),
        Assets.load('/assets/characters/scene03_lesya.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0xeadfcb });
      this.parallaxContainer.addChild(bg);
    }
  }

  initSchoolBell() {
    // School recess bell mounted on corridor wall (InteractiveObject with tactile feedback)
    this.bellContainer = new InteractiveObject({
      x: 380,
      y: 110,
      hitArea: new Rectangle(-25, -20, 50, 50),
      hapticType: 'medium',
      bounceScale: 1.25,
      bounceDuration: 100,
      soundEffect: () => soundManager.playSchoolBell(),
      onTap: () => {
        this.spawnHeartBurst(380, 110, 6, ['🔔', '✨', '🎶']);
      }
    });

    const g = new Graphics();
    // Metal bell base mount
    g.roundRect(-6, -6, 12, 12, 2);
    g.fill({ color: 0x2a2a2a });
    // Brass bell dome
    g.circle(0, 8, 14);
    g.fill({ color: 0xd9a438 });
    g.stroke({ color: 0x99701a, width: 1.5 });
    // Little striker hammer
    g.rect(10, 6, 8, 3);
    g.fill({ color: 0x333333 });

    this.bellContainer.addChild(g);
    this.addChild(this.bellContainer);
  }

  onEnter() {
    super.onEnter();
  }

  onLeave() {
    super.onLeave();
  }

  spawnKissBurst(x, y, count = 10, symbols = ['💋', '😘', '✨', '💖', '🥰']) {
    ParticlePool.spawnTextBurst(this.heartsContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 55,
      spreadY: 70,
      duration: 1300
    });
  }

  spawnHeartBurst(x, y, count = 12, symbols = ['💋', '😘', '❤️', '💖', '✨']) {
    ParticlePool.spawnTextBurst(this.heartsContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 65,
      spreadY: 75,
      duration: 1400
    });
  }

  update(delta) {
    super.update(delta);
    this.characters.forEach(c => c.update(delta));

    // Update snowflakes outside windows
    this.snowflakes.forEach(s => {
      s.gfx.y += s.vy * delta;
      s.wobbleOffset += s.wobbleSpeed * delta;
      s.gfx.x += (s.vx + Math.sin(s.wobbleOffset) * 0.4) * delta;

      if (s.gfx.y > 375) {
        s.gfx.y = 50;
        s.gfx.x = 560 + Math.random() * 420;
      }
    });
  }
}
