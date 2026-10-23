import { Container, Graphics, Text, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene07b_GraduationParty extends BaseScene {
  constructor() {
    super('scene07b', 'Выпускной бал и празднования (22 года)');
    this.characters = [];
    this.crowd = [];
    this.confetti = [];
    this.sparkles = [];
    this.lights = [];
    this.danceTime = 0;
    this.isSpinning = false;
  }

  async init() {
    // 1. Twilight / Golden Sunset Sky & Party Tents Scenery
    await this.initSunsetSky();

    // 2. Glowing Festoon Fairy String Lights (Гирлянда из теплых лампочек)
    this.initFestoonLights();

    // 3. Large Dancing Crowd in Background (Массовка выпускников и гостей)
    this.initBackgroundCrowd();

    // 4. Center Heroine: Olesya in Exquisite Silvery Silk Dress (Photo 2)
    // 5. Girlfriends Lineup (Liza, Kristina, Tanya, Anya in party evening dresses)
    this.initPartyCharacters();

    // 6. Particle Container (Confetti, bokeh, sparkles)
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }

  async initSunsetSky() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene07b_party.jpg'),
        Assets.load('/assets/characters/scene07b_kristina.png'),
        Assets.load('/assets/characters/scene07b_liza.png'),
        Assets.load('/assets/characters/scene07b_olesya.png'),
        Assets.load('/assets/characters/scene07b_tanya.png'),
        Assets.load('/assets/characters/scene07b_anya.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x28193d });
      this.parallaxContainer.addChild(bg);
    }
  }

  initFestoonLights() {
    this.lightsContainer = new InteractiveObject({
      hitArea: new Rectangle(0, 60, this.virtualWidth, 120),
      hapticType: 'light',
      bounceScale: 1.02,
      bounceDuration: 100,
      soundEffect: () => {
        soundManager.playSparkle();
        soundManager.playChampagneClink();
      },
      onTap: (e) => {
        const gx = e?.global?.x ?? (this.virtualWidth / 2);
        const gy = e?.global?.y ?? 120;
        this.spawnCelebrationBurst(gx, gy);
      }
    });
    this.addChild(this.lightsContainer);

    const wire = new Graphics();
    const lightBulbs = [];

    // Two hanging festoon wires arching gracefully across the sky
    const curves = [
      { startX: 20, startY: 85, midY: 155, endX: 512, endY: 105 },
      { startX: 512, startY: 105, midY: 155, endX: 1004, endY: 85 }
    ];

    curves.forEach(c => {
      wire.moveTo(c.startX, c.startY);
      wire.quadraticCurveTo(
        (c.startX + c.endX) / 2, c.midY,
        c.endX, c.endY
      );
      wire.stroke({ color: 0x1f1828, width: 2 });

      // Bulbs along each wire
      const bulbCount = 10;
      for (let i = 1; i < bulbCount; i++) {
        const t = i / bulbCount;
        const bx = (1 - t) * (1 - t) * c.startX + 2 * (1 - t) * t * ((c.startX + c.endX) / 2) + t * t * c.endX;
        const by = (1 - t) * (1 - t) * c.startY + 2 * (1 - t) * t * c.midY + t * t * c.endY;

        const bulb = new Graphics();
        // Warm halo
        bulb.circle(0, 0, 11);
        bulb.fill({ color: 0xffd56b, alpha: 0.28 });
        // Glowing bulb glass
        bulb.circle(0, 0, 4.5);
        bulb.fill({ color: 0xffedd5 });
        bulb.stroke({ color: 0xf59e0b, width: 1 });

        bulb.x = bx;
        bulb.y = by;
        this.lightsContainer.addChild(bulb);
        lightBulbs.push(bulb);
      }
    });

    this.lightsContainer.addChildAt(wire, 0);
    this.lights = lightBulbs;
  }

  initDanceFloor() {
    const deckX = 140;
    const deckW = this.virtualWidth - 280;
    const deckY = 370;
    const deckH = this.virtualHeight - deckY - 45;

    // Interactive click on dance floor to spawn confetti
    const floor = new Container();
    floor.eventMode = 'static';
    floor.cursor = 'pointer';
    floor.hitArea = new Rectangle(deckX, deckY, deckW, deckH);
    floor.on('pointerdown', (e) => {
      e.stopPropagation();
      soundManager.playDanceBeat();
      soundManager.playChampagneClink();
      this.spawnCelebrationBurst(e.global.x, e.global.y);
    });
    this.addChild(floor);
  }

  initBackgroundCrowd() {
    // Crowd removed per task requirements
  }

  initPartyCharacters() {
    const groundY = 472;

    // 1. Kristina (Left: Lilac cocktail dress, holding champagne glass, dancing)
    this.kristina = new Character({
      name: 'kristina',
      speakerTitle: 'Кристина',
      dialogueText: '«За нашу дружбу, за все пройденные сессии и за наше светлое будущее! Чин-чин! 🥂💜»',
      x: 290,
      y: groundY,
      width: 92,
      height: 188,
      textureUrl: '/assets/characters/scene07b_kristina.png'
    });
    this.addChild(this.kristina);
    this.characters.push(this.kristina);

    // 2. Liza (Beside Olesya on left: Burgundy cocktail dress, cheering)
    this.liza = new Character({
      name: 'liza',
      speakerTitle: 'Лиза',
      dialogueText: '«Олеся, ты просто королева этого вечера! Платье сияет невероятно! Танцуем! 💃✨»',
      x: 380,
      y: groundY,
      width: 96,
      height: 192,
      textureUrl: '/assets/characters/scene07b_liza.png'
    });
    this.addChild(this.liza);
    this.characters.push(this.liza);

    // 3. Central Heroine: Olesya in Exquisite Silvery Silk Evening Maxi Dress (Photo 2)
    this.olesya = new Character({
      name: 'olesya',
      speakerTitle: 'Олеся',
      dialogueText: '«Это самый незабываемый выпускной вечер! Музыка, танцы, любимые подруги и море радости! 🥂✨💃»',
      x: 485,
      y: groundY,
      width: 100,
      height: 196,
      textureUrl: '/assets/characters/scene07b_olesya.png'
    });
    this.addChild(this.olesya);
    this.characters.push(this.olesya);

    // 4. Tanya (Beside Olesya on right: Emerald cocktail dress, dancing)
    this.tanya = new Character({
      name: 'tanya',
      speakerTitle: 'Таня',
      dialogueText: '«Этот вечер останется в памяти навсегда! Музыку на полную громкость! 🎶✨»',
      x: 585,
      y: groundY,
      width: 94,
      height: 190,
      textureUrl: '/assets/characters/scene07b_tanya.png'
    });
    this.addChild(this.tanya);
    this.characters.push(this.tanya);

    // 5. Anya (Far right: Midnight blue dress, voluminous curls, toasting with flute)
    this.anya = new Character({
      name: 'anya',
      speakerTitle: 'Аня',
      dialogueText: '«Мы заслужили этот грандиозный праздник на все 100%! За лучший выпускной! 💙🥂»',
      x: 680,
      y: groundY,
      width: 96,
      height: 192,
      textureUrl: '/assets/characters/scene07b_anya.png'
    });
    this.addChild(this.anya);
    this.characters.push(this.anya);

    // Interactive Click Handler on Olesya: Graceful Dance Spin & Sparkle Fanfare!
    this.olesya.on('pointerdown', () => {
      this.triggerOlesyaDanceSpin();
    });
  }

  triggerOlesyaDanceSpin() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    soundManager.playChampagneClink();
    soundManager.playRomanticChime();

    // Graceful pirouette 360-degree rotation with scale shimmer
    new TWEEN.Tween(this.olesya.bodyContainer.scale)
      .to({ x: -1 }, 220)
      .yoyo(true)
      .repeat(1)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => {
        this.olesya.bodyContainer.scale.x = 1;
        this.isSpinning = false;
      })
      .start();

    // Spurt of silver & gold stars around Olesya
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 35 + Math.random() * 45;
      const sx = this.olesya.x + Math.cos(angle) * dist;
      const sy = this.olesya.y - 50 + Math.sin(angle) * dist;
      this.spawnSilverSparkle(sx, sy);
    }
  }

  spawnCelebrationBurst(x, y) {
    ParticlePool.spawnConfettiBurst(this.particlesContainer, {
      x,
      y,
      count: 22,
      spreadX: 160,
      spreadY: 100
    });
  }

  onEnter() {
    super.onEnter();
    soundManager.setBgmTrack('waltz');
  }

  onLeave() {
    super.onLeave();
    soundManager.setBgmTrack('nostalgic');
  }

  spawnSilverSparkle(x, y) {
    const sp = new Graphics();
    sp.poly([
      0, -6,
      1.8, -1.8,
      6, 0,
      1.8, 1.8,
      0, 6,
      -1.8, 1.8,
      -6, 0,
      -1.8, -1.8
    ]);
    sp.fill({ color: Math.random() > 0.4 ? 0xffffff : 0xffd56b, alpha: 0.95 });
    sp.x = x;
    sp.y = y;
    this.particlesContainer.addChild(sp);

    new TWEEN.Tween(sp)
      .to({ y: y - 30, alpha: 0, scale: { x: 1.4, y: 1.4 } }, 650)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => this.particlesContainer.removeChild(sp))
      .start();
  }

  update(delta) {
    super.update(delta);
    this.danceTime += delta * 0.05;

    // Rhythmic party dance sway for characters & background crowd
    this.characters.forEach((c, idx) => {
      c.update(delta);
      const sway = Math.sin(this.danceTime * 2.5 + idx * 0.8) * 0.04;
      c.bodyContainer.rotation = sway;
    });

    this.crowd.forEach((guest, idx) => {
      guest.update(delta);
      const crowdSway = Math.sin(this.danceTime * 2.8 + idx * 1.1) * 0.05;
      guest.bodyContainer.rotation = crowdSway;
    });

    // Gentle pulsing warm glow on festoon bulbs
    this.lights.forEach((bulb, idx) => {
      const pulse = 0.85 + Math.sin(this.danceTime * 2 + idx * 0.5) * 0.15;
      bulb.alpha = pulse;
    });

    // Floating party bokeh dust particles
    if (Math.random() < 0.16) {
      const bx = 120 + Math.random() * (this.virtualWidth - 240);
      const by = 260 + Math.random() * 160;
      this.spawnSilverSparkle(bx, by);
    }
  }
}
