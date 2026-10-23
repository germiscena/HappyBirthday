import { Container, Graphics, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';

export class Scene02_SchoolYears extends BaseScene {
  constructor() {
    super('scene02', 'Школьные годы и взросление (6–15 лет)');
    this.characters = [];
    this.leaves = [];
    this.notes = [];
  }

  async init() {
    // 1. Autumn sky gradient & scenery
    await this.initBackground();

    // 2. Stage ambient light glints
    this.initStageGlints();

    // 3. Music stage & music stand
    this.initMusicStand();

    // 4. Characters layer
    this.entityLayer = new Container();
    this.addChild(this.entityLayer);

    // MOM (Music teacher / Vocal coach) - scaled 2x (height 236px)
    this.mom = new Character({
      name: 'mom_music',
      charType: 'mom_music',
      speakerTitle: 'Мама',
      dialogueText: '«У тебя прекрасный слух и чистый голос, Лесенька! Держи нотку, на сцене актового зала ты звучишь великолепно! 🎼»',
      x: 350,
      y: 472,
      width: 96,
      height: 236,
      textureUrl: '/assets/characters/scene02_mom.png'
    });
    this.entityLayer.addChild(this.mom);
    this.characters.push(this.mom);

    // SCHOOLGIRL LESYA (Vocalist on stage) - scaled 2x (height 188px)
    this.lesya = new Character({
      name: 'lesya_school',
      charType: 'lesya_school',
      speakerTitle: 'Леся',
      dialogueText: '«Ля-ля-ля... 🎶 Люблю петь и выступать в нашем школьном актовом зале! Музыка наполняет всё вокруг теплом!»',
      x: 520,
      y: 472,
      width: 88,
      height: 188,
      textureUrl: '/assets/characters/scene02_lesya.png'
    });
    // Add custom ukulele strum on tap
    const origLesyaClick = this.lesya.onClick.bind(this.lesya);
    this.lesya.onClick = (e) => {
      soundManager.playUkuleleStrum();
      ParticlePool.spawnTextBurst(this.notesContainer, {
        x: this.lesya.x,
        y: this.lesya.y - 195,
        count: 3,
        symbols: ['🎵', '🎶', '🎼', '✨']
      });
      origLesyaClick(e);
    };
    this.entityLayer.addChild(this.lesya);
    this.characters.push(this.lesya);

    // 5. Container for floating musical notes
    this.notesContainer = new Container();
    this.addChild(this.notesContainer);
  }

  async initBackground() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene02_school.jpg'),
        Assets.load('/assets/characters/scene02_mom.png'),
        Assets.load('/assets/characters/scene02_lesya.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x765d4a });
      this.parallaxContainer.addChild(bg);
    }
  }



  initMusicStand() {
    // Music stand with sheet music (InteractiveObject with haptic feedback & bounce)
    this.musicStand = new InteractiveObject({
      x: 425,
      y: 472,
      hitArea: new Rectangle(-30, -112, 60, 116),
      hapticType: 'medium',
      bounceScale: 1.15,
      bounceDuration: 120,
      soundEffect: () => soundManager.playUkuleleStrum(),
      onTap: () => {
        this.spawnMusicNote(this.musicStand.x, this.musicStand.y - 100);
        ParticlePool.spawnTextBurst(this.notesContainer, {
          x: this.musicStand.x,
          y: this.musicStand.y - 110,
          count: 5,
          symbols: ['🎵', '🎶', '🎼', '✨', '⭐']
        });
      }
    });

    const g = new Graphics();

    // 1. Tripod stage base (three spread feet with rubber end caps)
    // Left leg
    g.poly([-2, -10, -20, 0, -20, -2, -2, -12]);
    g.fill({ color: 0x1b1b22 });
    // Left rubber foot cap
    g.roundRect(-22, -3, 5, 4, 1);
    g.fill({ color: 0x111116 });

    // Right leg
    g.poly([2, -10, 20, 0, 20, -2, 2, -12]);
    g.fill({ color: 0x1b1b22 });
    // Right rubber foot cap
    g.roundRect(17, -3, 5, 4, 1);
    g.fill({ color: 0x111116 });

    // Rear center leg
    g.poly([-2, -11, 0, -2, 2, -11]);
    g.fill({ color: 0x15151c });

    // Base collar / casting hub
    g.roundRect(-5, -14, 10, 6, 1);
    g.fill({ color: 0x272732 });
    g.stroke({ color: 0x3d3d4c, width: 1 });

    // 3. Telescopic metal shaft (two sections with clutch collar)
    // Lower outer tube (diameter 5px)
    g.rect(-2.5, -55, 5, 42);
    g.fill({ color: 0x22222a });
    g.stroke({ color: 0x14141a, width: 1 });
    // Specular highlight on tube
    g.rect(-1.5, -54, 1, 40);
    g.fill({ color: 0x444452 });

    // Center adjustment knob / locking clutch
    g.roundRect(-5, -58, 10, 6, 1.5);
    g.fill({ color: 0x2c2c38 });
    g.stroke({ color: 0x4a4a5c, width: 1 });
    g.circle(4, -55, 1.5);
    g.fill({ color: 0x6e6e84 }); // thumb screw

    // Upper inner tube (diameter 4px)
    g.rect(-2, -82, 4, 26);
    g.fill({ color: 0x262630 });
    g.stroke({ color: 0x16161e, width: 1 });
    g.rect(-1, -81, 1, 24);
    g.fill({ color: 0x4e4e60 });

    // Tilt bracket & mounting knuckle behind the desk
    g.roundRect(-4, -85, 8, 6, 1);
    g.fill({ color: 0x1c1c24 });
    g.stroke({ color: 0x383846, width: 1 });

    // 4. Music desk backplate (dark charcoal professional stage stand)
    // Outer desk frame
    g.roundRect(-22, -112, 44, 32, 2.5);
    g.fill({ color: 0x202028 });
    g.stroke({ color: 0x111116, width: 1.5 });

    // Inner desk recessed bevel / plate
    g.roundRect(-20, -110, 40, 28, 1.5);
    g.fill({ color: 0x272733 });

    // Desk top bevel highlight
    g.rect(-19, -111, 38, 1);
    g.fill({ color: 0x4d4d60, alpha: 0.8 });

    // 5. Bottom shelf / lip (где аккуратно стоит лист бумаги)
    g.roundRect(-23, -83, 46, 5, 1.5);
    g.fill({ color: 0x1c1c24 });
    g.stroke({ color: 0x101014, width: 1 });
    // Shelf front lip highlight
    g.rect(-22, -83, 44, 1);
    g.fill({ color: 0x545468 });

    // 6. Sheet music paper (пропорциональный, аккуратно и ровно закреплённый лист)
    // Sheet shadow onto desk
    g.rect(-16, -107, 34, 25);
    g.fill({ color: 0x14141a, alpha: 0.45 });

    // White / ivory sheet paper
    g.roundRect(-17, -108, 34, 25, 1);
    g.fill({ color: 0xfffdf6 });
    g.stroke({ color: 0x2b241c, width: 1 });

    // Subtle paper bottom/right inner edge tone
    g.rect(15, -107, 1, 23);
    g.fill({ color: 0xded6c2 });
    g.rect(-16, -85, 32, 1);
    g.fill({ color: 0xded6c2 });

    // Musical staff lines (нотные станы)
    // Title header line
    g.rect(-10, -105, 20, 1.5);
    g.fill({ color: 0x42382c });

    // Staff line group 1
    for (let i = 0; i < 3; i++) {
      g.rect(-14, -100 + i * 3.5, 28, 0.85);
      g.fill({ color: 0x3d352b });
    }
    // Pixel musical notes on group 1
    g.rect(-11, -101, 2, 2.5);
    g.fill({ color: 0x1a1510 }); // Treble clef block
    g.rect(-6, -97.5, 2, 2);
    g.fill({ color: 0x1a1510 }); // Note 1
    g.rect(-5, -100.5, 1, 3);
    g.fill({ color: 0x1a1510 }); // Stem
    g.rect(-1, -94, 2, 2);
    g.fill({ color: 0x1a1510 }); // Note 2
    g.rect(0, -97, 1, 3);
    g.fill({ color: 0x1a1510 }); // Stem
    g.rect(5, -97.5, 2, 2);
    g.fill({ color: 0x1a1510 }); // Note 3
    g.rect(6, -100.5, 1, 3);
    g.fill({ color: 0x1a1510 }); // Stem

    // Staff line group 2
    for (let i = 0; i < 3; i++) {
      g.rect(-14, -89 + i * 3.5, 28, 0.85);
      g.fill({ color: 0x3d352b });
    }
    // Pixel musical notes on group 2
    g.rect(-11, -90, 2, 2.5);
    g.fill({ color: 0x1a1510 });
    g.rect(-4, -86.5, 2, 2);
    g.fill({ color: 0x1a1510 });
    g.rect(-3, -89.5, 1, 3);
    g.fill({ color: 0x1a1510 });
    g.rect(2, -83, 2, 2);
    g.fill({ color: 0x1a1510 });
    g.rect(3, -86, 1, 3);
    g.fill({ color: 0x1a1510 });

    // 7. Metal page clips / prongs (пружинные фиксаторы, аккуратно держащие лист)
    // Left clip holding paper
    g.rect(-14, -85, 2.5, 5);
    g.fill({ color: 0x76788a });
    g.stroke({ color: 0x181820, width: 0.75 });
    g.rect(-13.5, -85, 1, 2);
    g.fill({ color: 0xc8ccdc }); // chrome highlight

    // Right clip holding paper
    g.rect(11.5, -85, 2.5, 5);
    g.fill({ color: 0x76788a });
    g.stroke({ color: 0x181820, width: 0.75 });
    g.rect(12, -85, 1, 2);
    g.fill({ color: 0xc8ccdc }); // chrome highlight

    this.musicStand.addChild(g);
    this.addChild(this.musicStand);
  }

  initStageGlints() {
    this.leavesContainer = new Container();
    this.addChild(this.leavesContainer);

    for (let i = 0; i < 22; i++) {
      const glint = new Graphics();
      glint.circle(0, 0, Math.random() * 2 + 1);
      glint.fill({ color: Math.random() > 0.5 ? 0xfff4b8 : 0xffd56b, alpha: Math.random() * 0.5 + 0.25 });
      glint.x = Math.random() * this.virtualWidth;
      glint.y = Math.random() * this.virtualHeight;
      this.leavesContainer.addChild(glint);
      this.leaves.push({
        gfx: glint,
        vy: Math.random() * 0.4 + 0.15,
        vx: Math.sin(Math.random() * Math.PI) * 0.2,
        rotSpeed: 0
      });
    }
  }

  spawnMusicNote(x, y) {
    ParticlePool.spawnTextBurst(this.notesContainer, {
      x,
      y,
      count: 3,
      symbols: ['🎵', '🎶', '🎼', '✨'],
      spreadX: 50,
      spreadY: 80,
      duration: 1400
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
    this.characters.forEach(c => c.update(delta));

    // Update ambient stage glints
    this.leaves.forEach(l => {
      l.gfx.y -= l.vy * delta * 0.5;
      l.gfx.x += l.vx * delta;
      if (l.gfx.y < 0) {
        l.gfx.y = this.virtualHeight;
        l.gfx.x = Math.random() * this.virtualWidth;
      }
    });
  }
}
