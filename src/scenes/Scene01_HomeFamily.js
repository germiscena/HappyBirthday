import { Container, Sprite, Assets, Graphics, Text } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { Butterfly } from '../entities/Butterfly.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';

export class Scene01_HomeFamily extends BaseScene {
  constructor() {
    super('scene01', 'Родной дом и семья (0–5 лет)');
    this.characters = [];
    this.particles = [];
    this.wanderTimeout = null;
    this.wanderTween = null;
    this.isWandering = false;
  }

  async init() {
    // 1. Load & add house environment background and character textures
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene01_house.jpg'),
        Assets.load('/assets/characters/scene01_dad.png'),
        Assets.load('/assets/characters/scene01_mom.png'),
        Assets.load('/assets/characters/scene01_sister.png'),
        Assets.load('/assets/characters/scene01_cat.png'),
        Assets.load('/assets/characters/scene01_heroine_toddler.png'),
        Assets.load('/assets/props/butterfly.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x4a7c59 });
      this.parallaxContainer.addChild(bg);
    }

    // 2. Sunbeams / warm particles
    this.particleContainer = new Container();
    this.addChild(this.particleContainer);
    this.initSunlightParticles();

    // 3. Characters Layer (Authentic 16-bit pixel-art character models)
    this.entityLayer = new Container();
    this.addChild(this.entityLayer);

    // DAD - height 177px on stage (scaled 150%)
    this.dad = new Character({
      name: 'dad',
      charType: 'dad',
      speakerTitle: 'Папа',
      dialogueText: '«Мы так тебя ждали и любили с первой секунды! Ты озарила наш дом светом! ❤️»',
      x: 225,
      y: 472,
      width: 72,
      height: 177,
      textureUrl: '/assets/characters/scene01_dad.png'
    });
    this.entityLayer.addChild(this.dad);
    this.characters.push(this.dad);

    // MOM - height 171px on stage (scaled 150%)
    this.mom = new Character({
      name: 'mom',
      charType: 'mom',
      speakerTitle: 'Мама',
      dialogueText: '«Моя милая девочка, я помню каждый твой первый шажочек! Ты — наше счастье! 💖»',
      x: 300,
      y: 472,
      width: 66,
      height: 171,
      textureUrl: '/assets/characters/scene01_mom.png'
    });
    this.entityLayer.addChild(this.mom);
    this.characters.push(this.mom);

    // NYUSHA THE CALICO CAT (sitting near parents and watching Toddler Lesya) (scaled 150%)
    this.cat = new Character({
      name: 'cat',
      charType: 'cat',
      speakerTitle: 'Нюша 🐾',
      dialogueText: '«Мур-р-р... 🐾 *Нюша ласково трётся о травку, мурлычет на солнышке и наблюдает за первыми шажками малышки Леси*»',
      x: 390,
      y: 490,
      width: 66,
      height: 66,
      textureUrl: '/assets/characters/scene01_cat.png'
    });
    const origCatClick = this.cat.onClick.bind(this.cat);
    this.cat.onClick = (e) => {
      soundManager.playCatPurr();
      ParticlePool.spawnTextBurst(this.entityLayer, {
        x: this.cat.x,
        y: this.cat.y - 70,
        count: 5,
        symbols: ['🐾', '💖', '✨', '🐱']
      });
      origCatClick(e);
    };
    this.entityLayer.addChild(this.cat);
    this.characters.push(this.cat);

    // SISTER YANKA - height 129px on stage (scaled 150%)
    this.sister = new Character({
      name: 'sister',
      charType: 'sister',
      speakerTitle: 'Янка',
      dialogueText: '«Ура-а, у меня появилась сестрёнка! Я буду учить тебя играть и защищать! 🎈»',
      x: 720,
      y: 485,
      width: 60,
      height: 129,
      textureUrl: '/assets/characters/scene01_sister.png'
    });
    this.entityLayer.addChild(this.sister);
    this.characters.push(this.sister);

    // TODDLER LESYA - height 78px on stage (scaled 150%, crawling towards butterfly)
    this.heroine = new Character({
      name: 'heroine',
      charType: 'heroine',
      speakerTitle: 'Малышка Леська',
      dialogueText: '«Топ-топ... Первые шажочки навстречу бабочке! Мир такой чудесный! ✨»',
      x: 500,
      y: 485,
      width: 78,
      height: 78,
      textureUrl: '/assets/characters/scene01_heroine_toddler.png'
    });
    this.entityLayer.addChild(this.heroine);
    this.characters.push(this.heroine);

    // Make Toddler take little playful steps back and forth!
    this.initHeroineWander();

    // 4. Golden Butterfly (tapping makes little Lesya jump with joy!)
    this.butterfly = new Butterfly(560, 420);
    this.butterfly.on('pointerdown', (e) => {
      if (this.heroine && this.heroine.jump) {
        this.heroine.jump();
      }
      ParticlePool.spawnTextBurst(this.entityLayer, {
        x: this.heroine.x,
        y: this.heroine.y - 80,
        count: 3,
        symbols: ['✨', '🌸', '💖']
      });
    });
    this.addChild(this.butterfly);

    // 5. Introductory gentle hint banner
    this.initStartHint();
  }

  initStartHint() {
    this.hintContainer = new Container();
    this.hintContainer.x = this.virtualWidth / 2;
    this.hintContainer.y = 82;
    this.hintContainer.alpha = 0;

    const bg = new Graphics();
    const w = 310;
    const h = 28;
    bg.roundRect(-w / 2, -h / 2, w, h, 14);
    bg.fill({ color: 0x181224, alpha: 0.88 });
    bg.stroke({ color: 0xffd56b, alpha: 0.75, width: 1.5 });
    this.hintContainer.addChild(bg);

    const txt = new Text({
      text: '✨ Нажимай на героев и предметы вокруг! 🐾',
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: 0xffecc4,
        align: 'center'
      }
    });
    txt.anchor.set(0.5);
    this.hintContainer.addChild(txt);
    this.addChild(this.hintContainer);

    // Fade in after 700ms, linger for 4s, then fade out
    setTimeout(() => {
      if (!this.hintContainer) return;
      new TWEEN.Tween(this.hintContainer)
        .to({ alpha: 1, y: 78 }, 450)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          setTimeout(() => {
            if (!this.hintContainer) return;
            new TWEEN.Tween(this.hintContainer)
              .to({ alpha: 0, y: 70 }, 550)
              .easing(TWEEN.Easing.Quadratic.In)
              .onComplete(() => {
                if (this.hintContainer && this.hintContainer.parent) {
                  this.hintContainer.parent.removeChild(this.hintContainer);
                  this.hintContainer = null;
                }
              })
              .start();
          }, 4000);
        })
        .start();
    }, 700);
  }

  initHeroineWander() {
    this.startHeroineWander();
  }

  startHeroineWander() {
    if (this.isWandering) return;
    this.isWandering = true;

    const wander = () => {
      if (!this.isWandering || !this.heroine) return;
      const targetX = 470 + Math.random() * 70;
      this.wanderTween = new TWEEN.Tween(this.heroine)
        .to({ x: targetX }, 2500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
          this.wanderTween = null;
          if (this.isWandering) {
            this.wanderTimeout = setTimeout(wander, 1500 + Math.random() * 2000);
          }
        })
        .start();
    };

    this.wanderTimeout = setTimeout(wander, 1000);
  }

  stopHeroineWander() {
    this.isWandering = false;
    if (this.wanderTimeout) {
      clearTimeout(this.wanderTimeout);
      this.wanderTimeout = null;
    }
    if (this.wanderTween) {
      this.wanderTween.stop();
      this.wanderTween = null;
    }
  }

  onEnter() {
    super.onEnter();
    this.startHeroineWander();
  }

  onLeave() {
    super.onLeave();
    this.stopHeroineWander();
  }

  initSunlightParticles() {
    for (let i = 0; i < 20; i++) {
      const p = new Graphics();
      p.circle(0, 0, Math.random() * 2 + 1);
      p.fill({ color: 0xfff0aa, alpha: Math.random() * 0.4 + 0.2 });
      p.x = Math.random() * this.virtualWidth;
      p.y = Math.random() * this.virtualHeight;

      this.particleContainer.addChild(p);
      this.particles.push({
        gfx: p,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: Math.sin(Math.random() * Math.PI) * 0.2,
        baseAlpha: p.alpha
      });
    }
  }

  update(delta) {
    super.update(delta);
    this.characters.forEach(c => c.update(delta));
    if (this.butterfly) {
      this.butterfly.update(delta);
    }

    // Update floating golden particles
    this.particles.forEach(p => {
      p.gfx.y -= p.speedY * delta;
      p.gfx.x += p.speedX * delta;
      if (p.gfx.y < 0) {
        p.gfx.y = this.virtualHeight;
        p.gfx.x = Math.random() * this.virtualWidth;
      }
    });
  }
}
