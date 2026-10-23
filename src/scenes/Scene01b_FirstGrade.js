import { Container, Graphics, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';
import { PhotoCardModal } from '../ui/PhotoCardModal.js';

export class Scene01b_FirstGrade extends BaseScene {
  constructor() {
    super('scene01b', '1 сентября — первый раз в первый класс (6 лет)');
    this.characters = [];
    this.sparkles = [];
  }

  async init() {
    // 1. Autumn sky, school building & landscaped courtyard (based on reference photo)
    await this.initEnvironment();

    // 2. Crowd layer (первоклассники и родители на средней и дальней дистанции)
    this.initSchoolCrowd();

    // 3. Interactive festive installation stand "Лошницкая гимназия Борисовского района"
    this.initFestiveStand();

    // 4. Central characters & family group layer
    this.entityLayer = new Container();
    this.addChild(this.entityLayer);

    // DAD - standing proudly by daughter (scaled 150%)
    this.dad = new Character({
      name: 'dad',
      charType: 'dad',
      speakerTitle: 'Папа',
      dialogueText: '«Какая же ты у нас уже взрослая, доченька! Первый раз в первый класс! Мы с мамой так гордимся тобой! ❤️»',
      x: 525,
      y: 525,
      width: 75,
      height: 177,
      textureUrl: '/assets/characters/scene01b_dad.png'
    });
    this.entityLayer.addChild(this.dad);
    this.characters.push(this.dad);

    // MOM - radiant smile, dressed elegantly (scaled 150%)
    this.mom = new Character({
      name: 'mom',
      charType: 'mom',
      speakerTitle: 'Мама',
      dialogueText: '«Моя милая первоклашечка! Банты белее снега, а глазки так и сияют! В добрый путь в страну знаний! 💖»',
      x: 590,
      y: 525,
      width: 72,
      height: 177,
      textureUrl: '/assets/characters/scene01b_mom.png'
    });
    this.entityLayer.addChild(this.mom);
    this.characters.push(this.mom);

    // FIRST-GRADER OLESYA (Central figure ~6 years old) (scaled 150%)
    this.olesya = new Character({
      name: 'olesya',
      charType: 'olesya_first_grade',
      speakerTitle: 'Олеся (1 класс) ✨',
      dialogueText: '«У меня самый красивый букет и огромные белые банты! Первый школьный звонок — так волнительно и радостно! 🔔🌸»',
      x: 650,
      y: 530,
      width: 66,
      height: 111,
      textureUrl: '/assets/characters/scene01b_olesya.png'
    });
    this.entityLayer.addChild(this.olesya);
    this.characters.push(this.olesya);

    // SISTER YANKA (~11 years old) (scaled 150%)
    this.sister = new Character({
      name: 'sister',
      charType: 'sister_first_grade',
      speakerTitle: 'Янка',
      dialogueText: '«Олеська, теперь мы в одной школе! Если что — сразу беги ко мне на переменке, я угощу пирожком и всё покажу! 🎒👭»',
      x: 712,
      y: 525,
      width: 66,
      height: 142,
      textureUrl: '/assets/characters/scene01b_sister.png'
    });
    this.entityLayer.addChild(this.sister);
    this.characters.push(this.sister);

    // PHOTOGRAPHER - facing family, taking commemorative picture (scaled 150%)
    this.photographer = new Character({
      name: 'photographer',
      charType: 'photographer',
      speakerTitle: 'Фотограф 📸',
      dialogueText: '«Внимание, семья! Олеся, покажи букет! Папа, мама, Янка — дружно улыбаемся! Раз, два, три — снято! 📸✨ Памятный кадр на всю жизнь!»',
      x: 450,
      y: 535,
      width: 72,
      height: 172,
      textureUrl: '/assets/characters/scene01b_photographer.png',
      flipX: true
    });
    const origPhotoClick = this.photographer.onClick.bind(this.photographer);
    this.photographer.onClick = (e) => {
      soundManager.playCameraShutter();
      this.triggerCameraFlash();
      ParticlePool.spawnTextBurst(this.fxContainer, {
        x: 650,
        y: 430,
        count: 5,
        symbols: ['📸', '✨', '💖', '⭐', '🌸']
      });
      // Show dialogue positioned neatly over photographer without blocking central Polaroid
      const globalPos = this.photographer.toGlobal({ x: -100, y: -this.photographer.charHeight - 24 });
      DialogBubble.show(this.photographer.speakerTitle, this.photographer.dialogueText, globalPos.x, globalPos.y, 2500);
      if (this.photographer.jump) this.photographer.jump();
    };
    this.entityLayer.addChild(this.photographer);
    this.characters.push(this.photographer);

    // 5. Ambient particles & FX layer
    this.fxContainer = new Container();
    this.addChild(this.fxContainer);
    this.initSunlightGlints();

    // 6. Camera flash white overlay
    this.flashOverlay = new Graphics();
    this.flashOverlay.rect(0, 0, this.virtualWidth, this.virtualHeight);
    this.flashOverlay.fill({ color: 0xffffff, alpha: 0 });
    this.addChild(this.flashOverlay);

    // 7. Keepsake Photo Card Modal UI
    this.photoModal = new PhotoCardModal();
    window.photoModal = this.photoModal;
  }

  async initEnvironment() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene01b_school.jpg'),
        Assets.load('/assets/characters/scene01b_dad.png'),
        Assets.load('/assets/characters/scene01b_mom.png'),
        Assets.load('/assets/characters/scene01b_olesya.png'),
        Assets.load('/assets/characters/scene01b_sister.png'),
        Assets.load('/assets/characters/scene01b_photographer.png'),
        Assets.load('/assets/characters/scene01b_crowd_family_girl.png'),
        Assets.load('/assets/characters/scene01b_crowd_family_boy.png')
      ]);
      const bgSprite = new Sprite(bgTexture);
      bgSprite.width = this.virtualWidth;
      bgSprite.height = this.virtualHeight;
      this.parallaxContainer.addChild(bgSprite);
    } catch (e) {
      console.warn('Fallback background', e);
      const bg = new Graphics();
      bg.rect(0, 0, this.virtualWidth, this.virtualHeight);
      bg.fill({ color: 0x82705e });
      this.parallaxContainer.addChild(bg);
    }
  }



  initSchoolCrowd() {
    this.crowdLayer = new Container();
    this.addChild(this.crowdLayer);

    // Group 1: First-grader girl with parents on walkway (scaled 150%, lowered badge)
    const familyGirl = new Character({
      name: 'family_girl',
      charType: 'family_girl',
      speakerTitle: 'Первоклассница Катя с родителями',
      dialogueText: '«А у меня гладиолусы выше меня ростом! Все такие красивые сегодня! Первый школьный звонок — такой трогательный день! 🔔🌸»',
      x: 770,
      y: 480,
      width: 135,
      height: 180,
      badgeOffsetY: 16,
      textureUrl: '/assets/characters/scene01b_crowd_family_girl.png'
    });
    this.characters.push(familyGirl);
    this.crowdLayer.addChild(familyGirl);

    // Group 2: First-grader boy with parents on walkway (scaled 150%, lowered badge)
    const familyBoy = new Character({
      name: 'family_boy',
      charType: 'family_boy',
      speakerTitle: 'Первоклассник Денис с родителями',
      dialogueText: '«Мы несём букет нашей первой учительнице! Новенький ранец, форма — так хочется скорее в класс! 🎒💐»',
      x: 908,
      y: 480,
      width: 135,
      height: 180,
      badgeOffsetY: 42,
      textureUrl: '/assets/characters/scene01b_crowd_family_boy.png'
    });
    this.characters.push(familyBoy);
    this.crowdLayer.addChild(familyBoy);
  }

  initFestiveStand() {
    // Interactive school emblem stand on the lawn ("Лошницкая гимназия Борисовского района")
    this.festiveStand = new InteractiveObject({
      x: 339,
      y: 373,
      hitArea: new Rectangle(-35, -40, 70, 80),
      dialogTitle: 'Лошницкая гимназия 🔔',
      dialogText: '«Лошницкая гимназия Борисовского района. Первый школьный звонок и торжественная линейка 1 сентября! 📚🔔✨»',
      hapticType: 'celebration',
      bounceScale: 1.08,
      bounceDuration: 120,
      soundEffect: () => {
        soundManager.playSchoolBell();
        ParticlePool.spawnTextBurst(this.fxContainer, {
          x: 339,
          y: 325,
          count: 5,
          symbols: ['🔔', '📚', '✨', '🍁', '🎉']
        });
      }
    });

    this.addChild(this.festiveStand);
  }

  initSunlightGlints() {
    for (let i = 0; i < 18; i++) {
      const g = new Graphics();
      g.circle(0, 0, Math.random() * 2 + 1);
      g.fill({ color: 0xfff2a3, alpha: Math.random() * 0.4 + 0.2 });
      g.x = Math.random() * this.virtualWidth;
      g.y = Math.random() * this.virtualHeight;
      this.fxContainer.addChild(g);
      this.sparkles.push({
        gfx: g,
        speedY: Math.random() * 0.25 + 0.08,
        speedX: Math.sin(Math.random() * Math.PI) * 0.15
      });
    }
  }

  onLeave() {
    super.onLeave();
    if (this.photoModal) {
      this.photoModal.hide();
    }
  }

  triggerCameraFlash() {
    this.flashOverlay.alpha = 0.85;
    new TWEEN.Tween(this.flashOverlay)
      .to({ alpha: 0 }, 400)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();

    // Show Keepsake Photo Card Modal
    if (this.photoModal) {
      this.photoModal.show();
    }
  }

  update(delta) {
    super.update(delta);
    this.characters.forEach(c => c.update(delta));

    // Update ambient golden sparkle particles
    this.sparkles.forEach(p => {
      p.gfx.y -= p.speedY * delta;
      p.gfx.x += p.speedX * delta;
      if (p.gfx.y < 0) {
        p.gfx.y = this.virtualHeight;
        p.gfx.x = Math.random() * this.virtualWidth;
      }
    });
  }
}
