import { Container, Graphics, Sprite, Rectangle } from 'pixi.js';
import { soundManager } from '../audio/SoundManager.js';

export class Butterfly extends Container {
  constructor(startX = 640, startY = 410) {
    super();
    this.x = startX;
    this.y = startY;
    this.baseX = startX;
    this.baseY = startY;
    this.time = Math.random() * 100;

    this.wingContainer = new Container();
    this.addChild(this.wingContainer);

    // Realistic custom sprite from user asset
    this.sprite = Sprite.from('/assets/props/butterfly.png');
    this.sprite.anchor.set(0.5);
    this.sprite.width = 36;
    this.sprite.height = 34;
    this.wingContainer.addChild(this.sprite);

    // Sparkles array
    this.sparkles = [];
    this.sparkleContainer = new Container();
    this.sparkleContainer.eventMode = 'none';
    this.addChild(this.sparkleContainer);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-20, -20, 40, 40);
    this.isBoosted = false;
    this.boostTimeout = null;

    this.on('pointerdown', (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      this.burstSparkles();
    });
  }

  burstSparkles() {
    soundManager.playSparkle();
    for (let i = 0; i < 12; i++) {
      const spk = new Graphics();
      spk.circle(0, 0, Math.random() * 2 + 1.5);
      spk.fill({ color: Math.random() > 0.5 ? 0xffea79 : 0xffffff });
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      
      this.sparkleContainer.addChild(spk);
      this.sparkles.push({
        gfx: spk,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0
      });
    }

    // Butterfly flutters higher on tap (safely prevented from stacking offscreen)
    if (!this.isBoosted) {
      this.isBoosted = true;
      this.baseY -= 35;
      if (this.boostTimeout) clearTimeout(this.boostTimeout);
      this.boostTimeout = setTimeout(() => {
        this.baseY += 35;
        this.isBoosted = false;
        this.boostTimeout = null;
      }, 1500);
    }
  }

  update(delta) {
    this.time += delta * 0.05;

    // Wing flap simulation: natural horizontal flutter
    const flap = Math.cos(this.time * 6);
    this.wingContainer.scale.x = 0.7 + 0.3 * flap;

    // Flutter trajectory
    this.x = this.baseX + Math.sin(this.time * 0.8) * 45;
    this.y = this.baseY + Math.cos(this.time * 1.2) * 20 - Math.abs(Math.sin(this.time * 1.5)) * 15;

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.life -= delta * 0.03;
      s.gfx.x += s.vx;
      s.gfx.y += s.vy;
      s.gfx.alpha = Math.max(0, s.life);

      if (s.life <= 0) {
        this.sparkleContainer.removeChild(s.gfx);
        s.gfx.destroy();
        this.sparkles.splice(i, 1);
      }
    }
  }
}
