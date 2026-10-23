import { Container, Graphics, Text, Rectangle, Sprite, Assets } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene.js';
import { Character } from '../entities/Character.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ParticlePool } from '../core/ParticlePool.js';
import { soundManager } from '../audio/SoundManager.js';
import { DialogBubble } from '../ui/DialogBubble.js';

export class Scene06_DentalClinic extends BaseScene {
  constructor() {
    super('scene06', 'Стоматологическая практика (19–21 год)');
    this.characters = [];
    this.sparkles = [];
    this.sparkleTimer = 0;
  }

  async init() {
    // 1. Clinical room scenery (full screen background, unchanged camera)
    await this.initClinicScenery();

    // 2. Dental Unit (interactive chair unit reduced to 70% scale)
    this.initDentalChair();

    // 3. Characters Layer (ровно 6 персонажей: пациент и 5 девочек, увеличены в 1.5 раза)
    this.entityLayer = new Container();
    this.addChild(this.entityLayer);

    const groundY = 526;
    const patientY = 512;

    // PATIENT: рядом со стоматологическим креслом под плакатом (масштаб 80%: 98x180):
    this.patient = new Character({
      name: 'patient',
      charType: 'student_patient',
      speakerTitle: 'Пациент (Студент)',
      dialogueText: '«А-а-а! 🦷 Девочки, только аккуратно! Я доверил вам свои зубы ради зачёта по практике! Доверяю вам на 100%! 😄»',
      x: 510,
      y: patientY,
      width: 98,
      height: 180,
      textureUrl: '/assets/characters/scene06_patient.png'
    });
    this.setupCharacterClick(this.patient, false);
    this.characters.push(this.patient);

    // ANYA: слева у окна и кресла (масштаб 80%: 98x208):
    this.anya = new Character({
      name: 'anya_scrub',
      charType: 'scrub_green',
      speakerTitle: 'Аня (Ассистент)',
      dialogueText: '«Слюноотсос включён, свет направлен! Доктор Олеся, к учебной операции готовы! 👩‍⚕️💉»',
      x: 120,
      y: groundY,
      width: 98,
      height: 208,
      textureUrl: '/assets/characters/scene06_anya.png'
    });
    this.setupCharacterClick(this.anya, false);
    this.characters.push(this.anya);

    // OLESYA: лечащий врач перед стоматологическим креслом (масштаб 80%: 102x211):
    this.olesya = new Character({
      name: 'olesya_scrub',
      charType: 'olesya_scrub',
      speakerTitle: 'Олеся 🦷',
      dialogueText: '«Держи ротик открытым! 🦷 Зеркальце наготове, приступаем к осмотру! Первая клиническая практика — это так захватывающе! ✨»',
      x: 335,
      y: groundY,
      width: 102,
      height: 211,
      textureUrl: '/assets/characters/scene06_olesya.png'
    });
    this.setupCharacterClick(this.olesya, true);
    this.characters.push(this.olesya);

    // TANYA: справа от пациента под часами (масштаб 80%: 98x208):
    this.tanya = new Character({
      name: 'tanya_scrub',
      charType: 'scrub_pink',
      speakerTitle: 'Таня',
      dialogueText: '«Классный кадр для студенческого архива! ✌️ После практики обязательно идём в кафе праздновать наши успехи! ☕💖»',
      x: 620,
      y: groundY,
      width: 98,
      height: 208,
      textureUrl: '/assets/characters/scene06_tanya.png'
    });
    this.setupCharacterClick(this.tanya, false);
    this.characters.push(this.tanya);

    // LIZA: в правой центральной части кабинета перед тумбой (масштаб 80%: 98x208):
    this.liza = new Character({
      name: 'liza_scrub',
      charType: 'scrub_green',
      speakerTitle: 'Лиза',
      dialogueText: '«Хирургички сидят на нас просто потрясающе! Настоящая стоматологическая банда в сборе! 🥼✨»',
      x: 775,
      y: groundY,
      width: 98,
      height: 208,
      textureUrl: '/assets/characters/scene06_liza.png'
    });
    this.setupCharacterClick(this.liza, false);
    this.characters.push(this.liza);

    // KRISTINA: в крайней правой части кабинета возле шкафа (масштаб 80%: 98x208):
    this.kristina = new Character({
      name: 'kristina_scrub',
      charType: 'scrub_pink',
      speakerTitle: 'Кристина',
      dialogueText: '«С такой профессиональной заботой наш пациент выйдет из кресла с голливудской улыбкой! 😁🦷»',
      x: 910,
      y: groundY,
      width: 98,
      height: 208,
      textureUrl: '/assets/characters/scene06_kristina.png'
    });
    this.setupCharacterClick(this.kristina, false);
    this.characters.push(this.kristina);

    // Add in depth order matching reference composition
    this.entityLayer.addChild(this.patient);
    this.entityLayer.addChild(this.anya);
    this.entityLayer.addChild(this.olesya);
    this.entityLayer.addChild(this.tanya);
    this.entityLayer.addChild(this.liza);
    this.entityLayer.addChild(this.kristina);

    // 4. Floating Sparkles & Dental Emojis Container
    this.particlesContainer = new Container();
    this.addChild(this.particlesContainer);
  }

  async initClinicScenery() {
    try {
      const [bgTexture] = await Promise.all([
        Assets.load('/assets/environments/scene06_clinic.jpg'),
        Assets.load('/assets/characters/scene06_anya.png'),
        Assets.load('/assets/characters/scene06_olesya.png'),
        Assets.load('/assets/characters/scene06_tanya.png'),
        Assets.load('/assets/characters/scene06_liza.png'),
        Assets.load('/assets/characters/scene06_kristina.png'),
        Assets.load('/assets/characters/scene06_patient.png')
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

  initDentalChair() {
    // Interactive Dental Chair
    this.dentalUnit = new InteractiveObject({
      x: 320,
      y: 430,
      hitArea: new Rectangle(-70, -80, 140, 110),
      hapticType: 'medium',
      bounceScale: 1.05,
      bounceDuration: 120,
      soundEffect: () => soundManager.playToothDrill(),
      onTap: () => {
        const globalPos = this.dentalUnit.toGlobal({ x: 0, y: -50 });
        this.spawnClinicBurst(globalPos.x, globalPos.y, 8, ['🦷', '✨', '💎', '🌸']);
      }
    });
    this.addChild(this.dentalUnit);
  }

  setupCharacterClick(char, isOlesya = false) {
    const orig = char.onClick.bind(char);
    char.onClick = (e) => {
      if (isOlesya) {
        soundManager.playToothDrill();
        this.spawnClinicBurst(char.x, char.y - 115, 16, ['🦷', '✨', '💖', '💎', '🥼', '🌸']);
      } else if (char === this.patient) {
        soundManager.playGiggle();
        if (this.patient.jump) this.patient.jump();
        this.spawnClinicBurst(char.x, char.y - 110, 10, ['🦷', '😄', '✨', '👍', '✌️']);
      } else {
        soundManager.playGiggle();
        this.spawnClinicBurst(char.x, char.y - 110, 10, ['✨', '🦷', '😄', '👏', '✌️']);
      }
      orig(e);
    };
  }

  spawnClinicBurst(x, y, count = 12, symbols = ['🦷', '✨', '💎', '💖']) {
    ParticlePool.spawnTextBurst(this.particlesContainer, {
      x,
      y,
      count,
      symbols,
      spreadX: 50,
      spreadY: 60,
      duration: 1200
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

    // Ambient dental sparkle aura around Olesya
    this.sparkleTimer += delta;
    if (this.sparkleTimer > 55) {
      this.sparkleTimer = 0;
      this.spawnClinicBurst(345, 330, 1, ['✨', '🦷', '💖']);
    }
  }
}
