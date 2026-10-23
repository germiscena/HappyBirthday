import { Container, Graphics, Text, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene07_GraduationDiplomas extends BaseScene {
  constructor() {
    super('scene07', 'Вручение дипломов (22 года)');
    this.characters = [];
    this.fountainDroplets = [];
    this.sparkles = [];
    this.diplomaTossActive = false;
  }

  async init() {
    // 1. Classical University backdrop, sky & grand fountain
    await this.initUniversityBackdrop();

    // 2. Central Grand Sparkling Fountain
    this.initGrandFountain();

    // 3. Five Graduates Lineup (Photo 1)
    this.initGraduates();

    // 4. Particle & Droplet Container
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }



  async initUniversityBackdrop() {
    try {
      // Preload VSMU environment & graduate character models
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene05_university.jpg'),
        Assets.load('/assets/characters/scene07_liza.png'),
        Assets.load('/assets/characters/scene07_kristina.png'),
        Assets.load('/assets/characters/scene07_olesya.png'),
        Assets.load('/assets/characters/scene07_tanya.png'),
        Assets.load('/assets/characters/scene07_anya.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x8c7866 });
      this.parallaxContainer.addChild(bg);
    }
  }

  initGrandFountain() {
    this.fountainContainer = new InteractiveObject({
      x: this.virtualWidth / 2,
      y: 395,
      hitArea: new Rectangle(-380, -190, 760, 260),
      hapticType: 'medium',
      bounceScale: 1.03,
      bounceDuration: 120,
      soundEffect: () => soundManager.playFountainSplash(),
      onTap: (e) => {
        const gx = e?.global?.x ?? (this.virtualWidth / 2);
        const gy = e?.global?.y ?? 395;
        this.spawnWaterSplashes(gx, gy);
      }
    });

    this.addChild(this.fountainContainer);
  }

  initGraduates() {
    const groundY = 472;

    // 1. Liza (Длинное чёрное платье с белым бантом на плече, синий диплом)
    this.liza = new Character({
      name: 'liza',
      speakerTitle: 'Лиза',
      dialogueText: '«Мы дошли до самого финиша! Теперь мы настоящие дипломированные врачи ВГМУ! Ура! 🎓💙»',
      x: 250,
      y: groundY,
      width: 62,
      height: 125,
      textureUrl: '/assets/characters/scene07_liza.png'
    });
    this.addChild(this.liza);
    this.characters.push(this.liza);

    // 2. Kristina (Белое платье с баской и кружевом)
    this.kristina = new Character({
      name: 'kristina',
      speakerTitle: 'Кристина',
      dialogueText: '«Олесечка, мы прошли через все сессии и бессонные ночи! Я так горжусь нами! 🤍✨»',
      x: 340,
      y: groundY,
      width: 60,
      height: 122,
      textureUrl: '/assets/characters/scene07_kristina.png'
    });
    this.addChild(this.kristina);
    this.characters.push(this.kristina);

    // 3. Central Heroine: Olesya (Тёмный приталенный костюм с белым кружевом, синий диплом)
    this.olesya = new Character({
      name: 'olesya',
      speakerTitle: 'Олеся',
      dialogueText: '«Ура-а-а! 5 лет в Витебском государственном медицинском университете позади! Наш заветный синий диплом врача у нас в руках! 🎓💙»',
      x: 435,
      y: groundY,
      width: 68,
      height: 138,
      textureUrl: '/assets/characters/scene07_olesya.png'
    });
    this.addChild(this.olesya);
    this.characters.push(this.olesya);

    // 4. Tanya (Белоснежный брючный костюм, синий диплом)
    this.tanya = new Character({
      name: 'tanya',
      speakerTitle: 'Таня',
      dialogueText: '«Стоматологический факультет ВГМУ, выпуск 2024! Мы лучшие и самые красивые! 🎉✨»',
      x: 530,
      y: groundY,
      width: 61,
      height: 124,
      textureUrl: '/assets/characters/scene07_tanya.png'
    });
    this.addChild(this.tanya);
    this.characters.push(this.tanya);

    // 5. Anya (Белый жилет, чёрные расклешённые брюки, кудри, синий диплом)
    this.anya = new Character({
      name: 'anya',
      speakerTitle: 'Аня',
      dialogueText: '«Свобода и диплом! Впереди взрослая жизнь и большая стоматологическая практика! 🦷🌟»',
      x: 620,
      y: groundY,
      width: 62,
      height: 125,
      textureUrl: '/assets/characters/scene07_anya.png'
    });
    this.addChild(this.anya);
    this.characters.push(this.anya);

    // Additional interactive click handler on Olesya to trigger celebratory fanfare
    this.olesya.on('pointerdown', () => {
      soundManager.playFanfare();
      soundManager.playApplause();
      this.triggerDiplomaToss();
    });
  }

  triggerDiplomaToss() {
    if (this.diplomaTossActive) return;
    this.diplomaTossActive = true;

    // Spawn 5 flying blue diplomas with gold ribbons floating up into the air directly above each graduate
    const diplomaXOffsets = this.characters.map(c => c.x);
    diplomaXOffsets.forEach((x, i) => {
      setTimeout(() => {
        const dip = new Graphics();
        dip.roundRect(-7, -10, 14, 20, 2);
        dip.fill({ color: 0x1e3a8a });
        dip.stroke({ color: 0x172554, width: 1 });
        dip.rect(-5, -3, 10, 2.5);
        dip.fill({ color: 0xfbbf24 });
        dip.circle(0, 3, 2);
        dip.fill({ color: 0xf59e0b });

        dip.x = x;
        dip.y = 400;
        dip.rotation = (Math.random() - 0.5) * 0.4;
        this.particlesContainer.addChild(dip);

        new TWEEN.Tween(dip)
          .to({ y: 260 - Math.random() * 40, rotation: dip.rotation + (Math.random() - 0.5) * 1.5 }, 600)
          .easing(TWEEN.Easing.Quadratic.Out)
          .chain(
            new TWEEN.Tween(dip)
              .to({ y: 410, alpha: 0 }, 550)
              .easing(TWEEN.Easing.Quadratic.In)
              .onComplete(() => {
                this.particlesContainer.removeChild(dip);
                if (i === diplomaXOffsets.length - 1) {
                  this.diplomaTossActive = false;
                }
              })
          )
          .start();

        // Sparkles trailing behind each diploma
        for (let s = 0; s < 4; s++) {
          this.spawnSparkle(x + (Math.random() - 0.5) * 20, 320 + Math.random() * 60);
        }
      }, i * 70);
    });
  }

  spawnWaterSplashes(x, y) {
    ParticlePool.spawnSplashes(this.particlesContainer, {
      x,
      y,
      count: 16,
      color: 0xffffff,
      radiusMax: 4.5,
      spreadX: 120,
      spreadY: 90
    });
  }

  onEnter() {
    super.onEnter();
  }

  onLeave() {
    super.onLeave();
  }

  spawnSparkle(x, y) {
    const sp = new Graphics();
    sp.poly([
      0, -5,
      1.5, -1.5,
      5, 0,
      1.5, 1.5,
      0, 5,
      -1.5, 1.5,
      -5, 0,
      -1.5, -1.5
    ]);
    sp.fill({ color: 0xffd56b, alpha: 0.9 });
    sp.x = x;
    sp.y = y;
    this.particlesContainer.addChild(sp);

    new TWEEN.Tween(sp)
      .to({ y: y - 35, alpha: 0, scale: { x: 1.5, y: 1.5 } }, 600)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => this.particlesContainer.removeChild(sp))
      .start();
  }

  update(delta) {
    super.update(delta);
    this.characters.forEach(c => c.update(delta));

    // Ambient floating water mist & sunlight sparkles
    if (Math.random() < 0.14) {
      const fx = this.virtualWidth / 2 + (Math.random() - 0.5) * 320;
      const fy = 240 + Math.random() * 150;
      this.spawnSparkle(fx, fy);
    }
  }
}
