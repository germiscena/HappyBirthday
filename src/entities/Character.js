import { Container, Graphics, Sprite, Assets, Text, Rectangle } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { DialogBubble } from '../ui/DialogBubble.js';
import { soundManager } from '../audio/SoundManager.js';
import { Haptics } from '../core/Haptics.js';

export class Character extends Container {
  constructor({ name, speakerTitle, dialogueText, x, y, width, height, charType, textureUrl, flipX, badgeOffsetY = 0, badgeOffsetX = 0 }) {
    super();
    this.name = name;
    this.speakerTitle = speakerTitle;
    this.dialogueText = dialogueText;
    this.x = x;
    this.y = y;
    this.targetY = y;
    this.charWidth = width || 50;
    this.charHeight = height || 100;
    this.charType = charType || name;
    this.flipX = !!flipX;
    this.badgeOffsetY = badgeOffsetY || 0;
    this.badgeOffsetX = badgeOffsetX || 0;

    // Precise hitbox covering strictly visible character bounds (no false neighbor clicks)
    const hitW = Math.max(26, Math.min(Math.round(this.charWidth * 0.58), 38));
    const extraTop = Math.max(0, -this.badgeOffsetY);
    const hitH = this.charHeight + 24 + extraTop;
    this.hitArea = new Rectangle(-hitW / 2, -this.charHeight - 24 - extraTop, hitW, hitH);
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Sprite or Block container
    this.bodyContainer = new Container();
    this.bodyContainer.y = -this.charHeight;
    this.addChild(this.bodyContainer);

    if (textureUrl) {
      this.initSprite(textureUrl);
    } else {
      this.createBlockCharacter(this.charType);
    }

    // Name badge floating above head
    this.createNameBadge(this.speakerTitle);

    // Interaction
    this.on('pointerdown', (e) => this.onClick(e));

    // Idle breathing animation
    this.timeOffset = Math.random() * 10;
  }

  createNameBadge(title) {
    if (!title) return;
    const badge = new Container();
    badge.x = this.badgeOffsetX || 0;
    badge.y = -14 + (this.badgeOffsetY || 0);

    const pillPaddingX = 14;
    const txt = new Text({
      text: title,
      style: {
        fontFamily: 'Comfortaa, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xffffff
      }
    });
    txt.anchor.set(0.5);

    const pillW = Math.max(50, Math.ceil(txt.width + pillPaddingX * 2));
    const pillH = 22;

    const bg = new Graphics();
    bg.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);
    bg.fill({ color: 0x181424, alpha: 0.9 });
    bg.stroke({ color: 0xffd56b, alpha: 0.65, width: 1 });

    badge.addChild(bg);
    badge.addChild(txt);
    this.nameBadgeContainer = badge;
    this.bodyContainer.addChild(badge);
  }

  setBadgeOffset(offsetY, offsetX = 0) {
    this.badgeOffsetY = offsetY;
    this.badgeOffsetX = offsetX;
    if (this.nameBadgeContainer) {
      this.nameBadgeContainer.y = -14 + offsetY;
      this.nameBadgeContainer.x = offsetX;
    }
  }

  createBlockCharacter(type) {
    const g = new Graphics();
    const w = this.charWidth;
    const h = this.charHeight;

    // Preset color palettes & styles
    const styles = {
      dad: {
        hair: 0x2e1f18, skin: 0xfcdbb8, shirt: 0x343a4a, pants: 0x38557d, shoes: 0x222222,
        hasMustache: true, hasHairBangs: false
      },
      mom: {
        hair: 0xfad566, skin: 0xffdfc4, shirt: 0xffcb36, pants: 0xf2b524, shoes: 0xdd7d22,
        hasMustache: false, hasHairBangs: true
      },
      mom_music: {
        hair: 0xfad566, skin: 0xffdfc4, shirt: 0x8a4570, pants: 0x482f48, shoes: 0x2a1a2c,
        hasMustache: false, hasHairBangs: true, hasScarf: true
      },
      sister: {
        hair: 0x2b1d19, skin: 0xfde1cb, shirt: 0xf27d88, pants: 0x3d628a, shoes: 0xffffff,
        hasMustache: false, hasHairBangs: true
      },
      heroine: { // Toddler Lesya (Scene 1)
        hair: 0x543224, skin: 0xffe2cf, shirt: 0xecf5ee, pants: 0x386194, shoes: 0xffa07a,
        hasMustache: false, hasHairBangs: false, isToddler: true
      },
      lesya_school: { // School Lesya with ukulele (Scene 2)
        hair: 0x4e2d1d, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x394867, shoes: 0x222222,
        hasMustache: false, hasHairBangs: true, hasUkulele: true
      },
      pashka: { // Pashka at 16 (tall, cozy winter sweater, stylish dark hair)
        hair: 0x261a14, skin: 0xfcdbb8, shirt: 0x2c4a5e, pants: 0x252d38, shoes: 0x1a1a1f,
        hasMustache: false, hasHairBangs: false, isPashka: true
      },
      lesya_16: { // Lesya at 16 (sweet, chestnut wavy hair, winter cardigan/skirt)
        hair: 0x4e2d1d, skin: 0xffdfcb, shirt: 0xb54d63, pants: 0x3d3145, shoes: 0x241d24,
        hasMustache: false, hasHairBangs: true, isLesya16: true
      },
      olesya_prom: { // 17yo Olesya in radiant emerald green dress (Scene 4)
        hair: 0x4e2d1d, skin: 0xffdfcb, dress: 0x16824f, dressAccent: 0x2ed185, shoes: 0xd4a037,
        hasMustache: false, hasHairBangs: true, isProm: true
      },
      classmate_m: { // Fellow male graduate on stage
        hair: 0x2e1f18, skin: 0xfcdbb8, shirt: 0x282c37, pants: 0x1f232b, shoes: 0x14161b,
        hasMustache: false, hasHairBangs: false, hasSash: true
      },
      classmate_f: { // Fellow female graduate on stage
        hair: 0xd49b4b, skin: 0xffdfcb, shirt: 0x5a3f78, pants: 0x3d2854, shoes: 0x251636,
        hasMustache: false, hasHairBangs: true, hasSash: true
      },
      olesya_med: { // 18yo Olesya in white lab coat & cap (Scene 5)
        hair: 0x4e2d1d, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x3d4b60, shoes: 0x242730,
        hasMustache: false, hasHairBangs: true, isMedStudent: true, isOlesyaMed: true, hasStethoscope: true, hasBook: true
      },
      tanya_med: { // Tanya - classmate
        hair: 0xf5d061, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x41506b, shoes: 0x252730,
        hasMustache: false, hasHairBangs: true, isMedStudent: true, hasStethoscope: true
      },
      anya_med: { // Anya - classmate with glasses
        hair: 0x2e1f18, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x514060, shoes: 0x252730,
        hasMustache: false, hasHairBangs: true, isMedStudent: true, hasGlasses: true
      },
      liza_med: { // Liza - classmate
        hair: 0xbf5c2e, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x3d4b60, shoes: 0x252730,
        hasMustache: false, hasHairBangs: true, isMedStudent: true
      },
      kristina_med: { // Kristina - classmate
        hair: 0xd8ba85, skin: 0xffdfcb, shirt: 0xffffff, pants: 0x4d3b5c, shoes: 0x252730,
        hasMustache: false, hasHairBangs: true, isMedStudent: true, hasBook: true
      },
      olesya_scrub: { // Olesya in pink/mauve scrub suit from photo (Scene 6)
        hair: 0x4e2d1d, skin: 0xffdfcb, shirt: 0x945674, pants: 0x945674, shoes: 0xf8fafc,
        hasMustache: false, hasHairBangs: true, isScrub: true, hasBlackGloves: true, hasDentalTool: true
      },
      scrub_pink: { // Girl in soft dusty pink scrub suit from photo
        hair: 0xd8ba85, skin: 0xffdfcb, shirt: 0xba798f, pants: 0xba798f, shoes: 0xf8fafc,
        hasMustache: false, hasHairBangs: true, isScrub: true, hasBlackGloves: true
      },
      scrub_green: { // Girl in sage green scrub suit from photo
        hair: 0x2e1f18, skin: 0xffdfcb, shirt: 0x5a6b5c, pants: 0x5a6b5c, shoes: 0xf8fafc,
        hasMustache: false, hasHairBangs: true, isScrub: true, hasBlackGloves: true
      },
      student_coat: { // Student in white lab coat
        hair: 0x422d20, skin: 0xfcdbb8, shirt: 0xffffff, pants: 0x3d4b60, shoes: 0x222226,
        hasMustache: false, hasHairBangs: false, isLabCoat: true
      },
      student_patient: { // Student in dental chair
        hair: 0x281a13, skin: 0xfcdbb8, shirt: 0x386594, pants: 0x2d3748, shoes: 0x1f242d,
        hasMustache: false, hasHairBangs: false, isPatient: true
      },
      olesya_grad_suit: { // Olesya in dark suit with white lace trim (Scene 7, Photo 1)
        hair: 0x4e2d1d, skin: 0xffdfcb, jacket: 0x2b2832, skirt: 0x2b2832, shoes: 0x18181c,
        hasMustache: false, hasHairBangs: true, isGradSuit: true, hasDiploma: true, diplomaFront: true
      },
      grad_liza: { // Liza in black gown with white shoulder bow (Scene 7, Photo 1)
        hair: 0x2e1f18, skin: 0xffdfcb, dress: 0x18181d, shoes: 0x18181c,
        hasMustache: false, hasHairBangs: false, isLizaGrad: true, hasDiploma: true, diplomaRaised: true
      },
      grad_kristina: { // Kristina in white dress with peplum & lace (Scene 7, Photo 1)
        hair: 0xd8ba85, skin: 0xffdfcb, dress: 0xf8fafc, shoes: 0xffffff,
        hasMustache: false, hasHairBangs: true, isKristinaGrad: true, hasDiploma: true, diplomaFront: true
      },
      grad_tanya: { // Tanya in white jumpsuit (Scene 7, Photo 1)
        hair: 0xf5d061, skin: 0xffdfcb, shirt: 0xf8fafc, pants: 0xf1f5f9, shoes: 0xffffff,
        hasMustache: false, hasHairBangs: true, isTanyaGrad: true, hasDiploma: true, diplomaRaised: true
      },
      grad_anya: { // Anya in white vest & black trousers (Scene 7, Photo 1)
        hair: 0x241712, skin: 0xffdfcb, vest: 0xf8fafc, pants: 0x18181d, shoes: 0x18181c,
        hasMustache: false, hasHairBangs: false, hasCurlyHair: true, isAnyaGrad: true, hasDiploma: true, diplomaRaised: true
      },
      olesya_silver_dress: { // Olesya in exquisite silvery-champagne silk evening dress (Scene 7b, Photo 2)
        hair: 0x4e2d1d, skin: 0xffdfcb, dress: 0xc8c3bd, dressLuster: 0xe6e2dc, dressShadow: 0x9c968f, shoes: 0xdfdcd8,
        hasMustache: false, hasHairBangs: false, isSilverDress: true, isUpdoHair: true, hasChampagne: true
      },
      party_liza: { // Liza at party
        hair: 0x2e1f18, skin: 0xffdfcb, dress: 0x882d46, shoes: 0x24121a,
        hasMustache: false, isPartyDress: true, hasChampagne: true
      },
      party_kristina: { // Kristina at party
        hair: 0xd8ba85, skin: 0xffdfcb, dress: 0x7c4d99, shoes: 0x2a1636,
        hasMustache: false, hasHairBangs: true, isPartyDress: true, hasChampagne: true
      },
      party_tanya: { // Tanya at party
        hair: 0xf5d061, skin: 0xffdfcb, dress: 0x1b7a63, shoes: 0x13382f,
        hasMustache: false, hasHairBangs: true, isPartyDress: true, hasChampagne: true
      },
      party_anya: { // Anya at party
        hair: 0x241712, skin: 0xffdfcb, dress: 0x24427c, shoes: 0x121d36,
        hasMustache: false, hasCurlyHair: true, isPartyDress: true, hasChampagne: true
      },
      party_guest_m: { // Male dancing guest
        hair: 0x2e1f18, skin: 0xfcdbb8, shirt: 0xffffff, jacket: 0x242838, pants: 0x1f232e, shoes: 0x14161b,
        hasMustache: false, isPartySuit: true, hasChampagne: true
      },
      party_guest_f: { // Female dancing guest
        hair: 0x4a2e1d, skin: 0xffdfcb, dress: 0xbf4365, shoes: 0x26141c,
        hasMustache: false, isPartyDress: true, hasChampagne: true
      },
      olesya_first_grade: { // 7yo Olesya in first grade with white apron & bows
        hair: 0x4e2d1d, skin: 0xffdfcb, dress: 0x222a38, apron: 0xffffff, shoes: 0x1a1a1f,
        hasMustache: false, hasHairBangs: true, isFirstGrader: true, hasWhiteBows: true, hasBouquet: true
      },
      sister_first_grade: { // Yanka ~11yo supporting little sister
        hair: 0x2b1d19, skin: 0xfde1cb, shirt: 0xffffff, jacket: 0x683b54, pants: 0x364156, skirt: 0x364156, shoes: 0x1f1f24,
        hasMustache: false, hasHairBangs: true, isSisterPupil: true
      },
      photographer: { // Photographer capturing family portrait
        hair: 0x362b24, skin: 0xfcdbb8, shirt: 0x3b5066, vest: 0x242d38, pants: 0x22262e, shoes: 0x16181d,
        hasMustache: false, hasHairBangs: false, isPhotographer: true
      },
      pupil_boy: { // Schoolboy first-grader in crowd
        hair: 0x2c1d18, skin: 0xfcdbb8, shirt: 0xffffff, pants: 0x243247, shoes: 0x1a1a1f,
        hasMustache: false, hasHairBangs: false, isPupilBoy: true
      },
      pupil_girl: { // Schoolgirl first-grader in crowd
        hair: 0xd9b36c, skin: 0xffdfcb, dress: 0x243247, apron: 0xffffff, pants: 0x243247, shoes: 0x1a1a1f,
        hasMustache: false, hasHairBangs: true, isFirstGrader: true, hasWhiteBows: true
      },
      parent_m: { // Father in crowd
        hair: 0x2b1d19, skin: 0xfcdbb8, shirt: 0x4a5d6e, pants: 0x292f38, shoes: 0x1a1a1f,
        hasMustache: true, hasHairBangs: false
      },
      parent_f: { // Mother in crowd
        hair: 0xb57842, skin: 0xffdfcb, dress: 0x5a3b68, shirt: 0x5a3b68, pants: 0x382244, shoes: 0x221a29,
        hasMustache: false, hasHairBangs: true
      },
      cat: { // Calico cat Nyusha based on photo (white, ginger, dark brown/black spots, golden-amber eyes)
        isCat: true,
        furWhite: 0xffffff,
        furOrange: 0xd96b27,
        furDark: 0x2e1d18,
        nose: 0xf58ea1,
        eyes: 0xd4a028
      }
    };

    const s = styles[type] || styles.heroine;

    if (s.isCat) {
      this.drawCatBlock(g, w, h, s);
    } else {
      this.drawHumanBlock(g, w, h, s);
    }

    this.bodyContainer.addChild(g);
  }

  drawHumanBlock(g, w, h, s) {
    const headH = Math.round(h * 0.38);
    const bodyH = Math.round(h * 0.40);
    const legsH = h - headH - bodyH;
    const bodyW = Math.round(w * 0.85);
    const headW = Math.round(w * 0.78);

    // 1. Prom Emerald Gown vs Standard Pants/Shoes
    if (s.isProm) {
      // Golden evening shoes peeking out
      g.roundRect(-bodyW / 2 + 2, h - 5, 10, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - 12, h - 5, 10, 5, 2);
      g.fill({ color: s.shoes });

      // Flared Emerald Green Ball Gown Skirt
      const dressTopY = headH + bodyH * 0.3;
      const flare = 12;
      g.poly([
        -bodyW / 2 - flare, h - 2,
        bodyW / 2 + flare, h - 2,
        bodyW / 2, dressTopY,
        -bodyW / 2, dressTopY
      ]);
      g.fill({ color: s.dress });

      // Shimmering Emerald folds
      g.poly([
        -bodyW * 0.2, dressTopY,
        bodyW * 0.2, dressTopY,
        bodyW * 0.3, h - 2,
        -bodyW * 0.3, h - 2
      ]);
      g.fill({ color: s.dressAccent, alpha: 0.45 });

      // Golden hem trim
      g.roundRect(-bodyW / 2 - flare, h - 3, bodyW + flare * 2, 3, 1);
      g.fill({ color: 0xffd56b });

      // Emerald Bodice / Corset
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.4, 4);
      g.fill({ color: s.dress });

      // Golden Graduation Sash across shoulder
      g.poly([
        -bodyW / 2 + 2, headH + 2,
        -bodyW / 2 + 9, headH + 2,
        bodyW / 2 - 2, dressTopY + 12,
        bodyW / 2 - 9, dressTopY + 12
      ]);
      g.fill({ color: 0xd99f2e });
      g.stroke({ color: 0xffe885, width: 0.8 });

    } else if (s.isSilverDress) {
      // Silvery evening shoes peeking out
      g.roundRect(-bodyW * 0.28, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW * 0.16, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });

      // Flowing maxi silk skirt down to ground from empire waist (Scene 7b, Photo 2)
      const empireY = headH + bodyH * 0.42;
      g.poly([
        -bodyW / 2 - 4, h - 2,
        bodyW / 2 + 4, h - 2,
        bodyW / 2 - 1, empireY,
        -bodyW / 2 + 1, empireY
      ]);
      g.fill({ color: s.dress });

      // Shimmering silk fold highlights
      g.poly([
        -bodyW * 0.15, empireY,
        bodyW * 0.05, empireY,
        bodyW * 0.12, h - 2,
        -bodyW * 0.08, h - 2
      ]);
      g.fill({ color: s.dressLuster, alpha: 0.55 });

      g.poly([
        bodyW * 0.18, empireY + 12,
        bodyW * 0.32, empireY + 12,
        bodyW * 0.4, h - 2,
        bodyW * 0.26, h - 2
      ]);
      g.fill({ color: s.dressShadow, alpha: 0.35 });

      // Empire gathered bodice
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.45, 4);
      g.fill({ color: s.dress });

      // Ruching seam line under bust
      g.arc(0, empireY, bodyW * 0.42, 0.1, Math.PI - 0.1);
      g.stroke({ color: s.dressShadow, width: 1.5 });

    } else if (s.isGradSuit) {
      // Olesya in dark suit with white lace trim (Scene 7, Photo 1)
      const legW = Math.round(bodyW * 0.36);

      // Left straight leg with chunky black Mary Jane platform shoe
      g.roundRect(-bodyW / 2 + 2, headH + bodyH * 0.65, legW, legsH + bodyH * 0.35, 3);
      g.fill({ color: s.skin });
      g.roundRect(-bodyW / 2, h - 7, legW + 4, 7, 3); // chunky sole
      g.fill({ color: s.shoes });
      g.rect(-bodyW / 2 + 1, h - 11, legW + 2, 2); // ankle strap
      g.fill({ color: s.shoes });

      // Right leg bent playfully at knee (kicked up sideways/back, matching Photo 1)
      g.poly([
        bodyW * 0.1, headH + bodyH * 0.7,
        bodyW * 0.65, headH + bodyH * 0.95,
        bodyW * 0.55, headH + bodyH * 1.15,
        bodyW * 0.05, headH + bodyH * 0.85
      ]);
      g.fill({ color: s.skin });
      // Bent chunky shoe
      g.roundRect(bodyW * 0.45, headH + bodyH * 1.0, 10, 8, 3);
      g.fill({ color: s.shoes });

      // Dark mini skirt
      const skirtY = headH + bodyH * 0.5;
      g.roundRect(-bodyW / 2, skirtY, bodyW, bodyH * 0.45, 2);
      g.fill({ color: s.skirt });
      // White scalloped lace hem trim
      g.roundRect(-bodyW / 2 - 1, skirtY + bodyH * 0.42, bodyW + 2, 3, 1);
      g.fill({ color: 0xffffff });

      // Dark tailored jacket bodice
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.58, 3);
      g.fill({ color: s.jacket });
      // White lace lapels / collar
      g.poly([-bodyW * 0.28, headH, 0, headH + 12, bodyW * 0.28, headH]);
      g.stroke({ color: 0xffffff, width: 2.2 });
      // Center white lace border
      g.rect(-1, headH + 10, 2, bodyH * 0.48);
      g.fill({ color: 0xffffff });

      // Black choker with lace on neck
      g.rect(-bodyW * 0.25, headH - 3, bodyW * 0.5, 3);
      g.fill({ color: 0x111111 });
      g.circle(0, headH - 1.5, 1.5);
      g.fill({ color: 0xffffff });

    } else if (s.isLizaGrad) {
      // Long black evening gown down to ankles (Scene 7, Photo 1)
      g.poly([
        -bodyW / 2, headH + bodyH * 0.35,
        bodyW / 2, headH + bodyH * 0.35,
        bodyW / 2 + 2, h - 2,
        -bodyW / 2 - 2, h - 2
      ]);
      g.fill({ color: s.dress });
      // Shoes peeking out
      g.roundRect(-bodyW / 2 + 2, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - 4, h - 6, 8, 6, 2);
      g.fill({ color: s.shoes });

      // Bodice
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.45, 3);
      g.fill({ color: s.dress });
      // White asymmetrical neckline trim
      g.rect(-bodyW / 2, headH + 1, bodyW, 3);
      g.fill({ color: 0xffffff });
      // Big white shoulder bow with trailing ribbons!
      g.circle(-bodyW / 2 + 2, headH + 2, 4);
      g.fill({ color: 0xffffff });
      g.poly([
        -bodyW / 2 + 1, headH + 4,
        -bodyW / 2 + 4, headH + 4,
        -bodyW / 2 + 6, headH + bodyH * 0.85,
        -bodyW / 2 + 2, headH + bodyH * 0.85
      ]);
      g.fill({ color: 0xffffff });

    } else if (s.isKristinaGrad) {
      // Kristina in ivory dress with peplum and lace (Scene 7, Photo 1)
      const skirtY = headH + bodyH * 0.45;
      g.roundRect(-bodyW / 2, skirtY, bodyW, bodyH * 0.5, 2);
      g.fill({ color: s.dress });
      // Peplum ruffle
      g.poly([
        -bodyW / 2 - 4, skirtY + 8,
        bodyW / 2 + 4, skirtY + 8,
        bodyW / 2, skirtY,
        -bodyW / 2, skirtY
      ]);
      g.fill({ color: 0xf1f5f9 });
      // Sheer lace overskirt
      g.poly([
        -bodyW / 2 - 2, h - 2,
        bodyW / 2 + 2, h - 2,
        bodyW / 2, skirtY + 8,
        -bodyW / 2, skirtY + 8
      ]);
      g.fill({ color: 0xffffff, alpha: 0.45 });
      // White pointed heels
      g.roundRect(-bodyW / 2 + 3, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - 11, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      // Bodice
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.48, 3);
      g.fill({ color: s.dress });

    } else if (s.isTanyaGrad) {
      // Tanya in white jumpsuit (Scene 7, Photo 1)
      const legW = Math.round(bodyW * 0.42);
      g.roundRect(-bodyW / 2, headH + bodyH * 0.6, legW, legsH + bodyH * 0.4, 4);
      g.fill({ color: s.pants });
      g.roundRect(bodyW / 2 - legW, headH + bodyH * 0.6, legW, legsH + bodyH * 0.4, 4);
      g.fill({ color: s.pants });
      // White pointed pumps
      g.roundRect(-bodyW / 2 - 1, h - 5, legW + 2, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - legW - 1, h - 5, legW + 2, 5, 2);
      g.fill({ color: s.shoes });
      // Fitted corset top
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.65, 3);
      g.fill({ color: s.shirt });

    } else if (s.isAnyaGrad) {
      // Anya in black flared trousers & white vest (Scene 7, Photo 1)
      const legW = Math.round(bodyW * 0.42);
      g.roundRect(-bodyW / 2, headH + bodyH * 0.65, legW, legsH + bodyH * 0.35, 4);
      g.fill({ color: s.pants });
      g.roundRect(bodyW / 2 - legW, headH + bodyH * 0.65, legW, legsH + bodyH * 0.35, 4);
      g.fill({ color: s.pants });
      // Dark shoes
      g.roundRect(-bodyW / 2, h - 5, legW, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - legW, h - 5, legW, 5, 2);
      g.fill({ color: s.shoes });
      // Tailored white vest with dark buttons
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.7, 3);
      g.fill({ color: s.vest });
      g.poly([-bodyW * 0.25, headH, 0, headH + 11, bodyW * 0.25, headH]);
      g.stroke({ color: 0xd0dae5, width: 1.2 });
      g.circle(0, headH + 15, 1.2); g.fill({ color: 0x18181c });
      g.circle(0, headH + 21, 1.2); g.fill({ color: 0x18181c });

    } else if (s.isPartyDress) {
      // Cocktail party dress
      g.poly([
        -bodyW / 2 - 6, h - 4,
        bodyW / 2 + 6, h - 4,
        bodyW / 2, headH + bodyH * 0.4,
        -bodyW / 2, headH + bodyH * 0.4
      ]);
      g.fill({ color: s.dress });
      g.roundRect(-bodyW / 2 + 2, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - 10, h - 5, 8, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH * 0.45, 3);
      g.fill({ color: s.dress });

    } else if (s.isFirstGrader) {
      // 7yo First-grader school uniform with white pinafore / apron
      const legW = Math.round(bodyW * 0.32);
      // Legs with white knee-high socks
      g.roundRect(-bodyW * 0.38, headH + bodyH * 0.65, legW, legsH + bodyH * 0.35, 2);
      g.fill({ color: 0xffffff });
      g.roundRect(bodyW * 0.06, headH + bodyH * 0.65, legW, legsH + bodyH * 0.35, 2);
      g.fill({ color: 0xffffff });
      // Black school shoes
      g.roundRect(-bodyW * 0.42, h - 5, legW + 3, 5, 2);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW * 0.04, h - 5, legW + 3, 5, 2);
      g.fill({ color: s.shoes });

      // Dark brown/navy school dress skirt
      const skirtY = headH + bodyH * 0.45;
      g.poly([
        -bodyW / 2 - 3, headH + bodyH * 0.85,
        bodyW / 2 + 3, headH + bodyH * 0.85,
        bodyW / 2, skirtY,
        -bodyW / 2, skirtY
      ]);
      g.fill({ color: s.dress || 0x242d3d });

      // Festive crisp white apron (белый фартук)
      g.poly([
        -bodyW * 0.36, headH + bodyH * 0.82,
        bodyW * 0.36, headH + bodyH * 0.82,
        bodyW * 0.26, skirtY + 2,
        -bodyW * 0.26, skirtY + 2
      ]);
      g.fill({ color: 0xffffff });
      // Apron frills / straps
      g.poly([-bodyW * 0.35, headH, -bodyW * 0.15, headH, -bodyW * 0.1, skirtY + 2, -bodyW * 0.3, skirtY + 2]);
      g.fill({ color: 0xffffff });
      g.poly([bodyW * 0.15, headH, bodyW * 0.35, headH, bodyW * 0.3, skirtY + 2, bodyW * 0.1, skirtY + 2]);
      g.fill({ color: 0xffffff });
      // White lace collar
      g.poly([-bodyW * 0.28, headH, 0, headH + 6, bodyW * 0.28, headH]);
      g.fill({ color: 0xffffff });

    } else if (s.isPhotographer) {
      // Legs / dark trousers
      const legW = Math.round(bodyW * 0.38);
      g.roundRect(-bodyW / 2, headH + bodyH, legW, legsH, 4);
      g.fill({ color: s.pants });
      g.roundRect(-bodyW / 2 - 2, h - 6, legW + 3, 6, 3);
      g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - legW, headH + bodyH, legW, legsH, 4);
      g.fill({ color: s.pants });
      g.roundRect(bodyW / 2 - legW - 1, h - 6, legW + 3, 6, 3);
      g.fill({ color: s.shoes });

      // Body / Torso
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH, 4);
      g.fill({ color: s.shirt });
      // Utility vest
      g.roundRect(-bodyW / 2 - 1, headH + 1, bodyW * 0.44, bodyH * 0.75, 2);
      g.fill({ color: s.vest || 0x242d38 });
      g.roundRect(bodyW * 0.06 + 1, headH + 1, bodyW * 0.44, bodyH * 0.75, 2);
      g.fill({ color: s.vest || 0x242d38 });

    } else if (s.isPartySuit) {
      // Party suit
      const legW = Math.round(bodyW * 0.38);
      g.roundRect(-bodyW / 2, headH + bodyH, legW, legsH, 4); g.fill({ color: s.pants });
      g.roundRect(bodyW / 2 - legW, headH + bodyH, legW, legsH, 4); g.fill({ color: s.pants });
      g.roundRect(-bodyW / 2, h - 6, legW, 6, 2); g.fill({ color: s.shoes });
      g.roundRect(bodyW / 2 - legW, h - 6, legW, 6, 2); g.fill({ color: s.shoes });
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH, 4); g.fill({ color: s.jacket });
      g.poly([-bodyW * 0.22, headH, 0, headH + 10, bodyW * 0.22, headH]);
      g.fill({ color: s.shirt });

    } else {
      // Standard Shoes / Legs
      const legColor = s.pants || s.skirt || s.dress || 0x242d38;
      const shoeColor = s.shoes || 0x1a1a1f;
      const shirtColor = s.shirt || s.dress || s.jacket || 0xffffff;
      const legW = Math.round(bodyW * 0.38);

      g.roundRect(-bodyW / 2, headH + bodyH, legW, legsH, 4);
      g.fill({ color: legColor });
      g.roundRect(-bodyW / 2 - 2, h - 6, legW + 3, 6, 3);
      g.fill({ color: shoeColor });

      g.roundRect(bodyW / 2 - legW, headH + bodyH, legW, legsH, 4);
      g.fill({ color: legColor });
      g.roundRect(bodyW / 2 - legW - 1, h - 6, legW + 3, 6, 3);
      g.fill({ color: shoeColor });

      // Body / Torso
      g.roundRect(-bodyW / 2, headH, bodyW, bodyH, 6);
      g.fill({ color: shirtColor });
      g.stroke({ color: 0x000000, alpha: 0.15, width: 1 });

      // White Lab Coat for Medical Students (Scene 5)
      if (s.isMedStudent || s.isLabCoat) {
        g.roundRect(-bodyW / 2 - 1, headH, bodyW + 2, bodyH + 8, 4);
        g.fill({ color: 0xffffff });
        g.stroke({ color: 0xd0dae5, width: 1 });
        // Coat Lapel Collar
        g.poly([-bodyW * 0.28, headH, 0, headH + 11, bodyW * 0.28, headH]);
        g.stroke({ color: 0xbac8d6, width: 1.2 });
        // Chest Pocket with pen
        g.roundRect(-bodyW * 0.38, headH + 7, 8, 8, 1);
        g.fill({ color: 0xf0f4f8 });
        g.rect(-bodyW * 0.38 + 2, headH + 5, 2, 5);
        g.fill({ color: 0x2266cc });
      }

      // Scrub Suit V-neck & waist tie (Scene 6)
      if (s.isScrub) {
        g.poly([-bodyW * 0.28, headH, 0, headH + 11, bodyW * 0.28, headH]);
        g.stroke({ color: 0x000000, alpha: 0.25, width: 1.2 });
        g.roundRect(-bodyW * 0.25, headH + bodyH * 0.52, bodyW * 0.5, 3, 1.5);
        g.fill({ color: 0x000000, alpha: 0.18 });
      }

      // Dental Patient Bib (Scene 6)
      if (s.isPatient) {
        g.roundRect(-bodyW * 0.4, headH + 2, bodyW * 0.8, bodyH * 0.75, 2);
        g.fill({ color: 0x7dd3fc });
        g.stroke({ color: 0x38bdf8, width: 1 });
      }

      // Red Graduate Ribbon / Sash for Classmates
      if (s.hasSash) {
        g.poly([
          -bodyW / 2 + 3, headH + 2,
          -bodyW / 2 + 10, headH + 2,
          bodyW / 2 - 2, headH + bodyH - 2,
          bodyW / 2 - 9, headH + bodyH - 2
        ]);
        g.fill({ color: 0xc4272f });
        g.stroke({ color: 0xffd56b, width: 0.7 });
      }
    }

    // 2. Arms
    const armW = Math.round(w * 0.14);
    if (s.isPashka) {
      g.roundRect(-bodyW / 2 - armW + 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: s.shirt });
      g.roundRect(bodyW / 2 - 2, headH + 8, armW + 6, armW + 2, 4);
      g.fill({ color: s.shirt });
      g.circle(bodyW / 2 + armW + 3, headH + 10, armW * 0.55);
      g.fill({ color: s.skin });
    } else if (s.isLesya16) {
      g.roundRect(-bodyW / 2 - armW - 4, headH + 8, armW + 6, armW + 2, 4);
      g.fill({ color: s.shirt });
      g.circle(-bodyW / 2 - armW - 2, headH + 10, armW * 0.55);
      g.fill({ color: s.skin });
      g.roundRect(bodyW / 2 - 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: s.shirt });
    } else if (s.isProm) {
      // Elegant bare arms holding a flower bouquet or at waist
      g.roundRect(-bodyW / 2 - armW + 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: s.skin });
      g.roundRect(bodyW / 2 - 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: s.skin });

      // Small celebratory white rose corsage
      g.circle(-bodyW / 2 - armW / 2, headH + bodyH * 0.75, 3.5);
      g.fill({ color: 0xffffff });
      g.circle(bodyW / 2 + armW / 2, headH + bodyH * 0.75, 2.5);
      g.fill({ color: s.skin });
    } else if (s.isSilverDress) {
      // Long fluid bishop sleeves in silver silk (Scene 7b, Photo 2)
      const armW = Math.round(w * 0.16);
      g.roundRect(-bodyW / 2 - armW + 1, headH + 3, armW + 2, bodyH * 0.78, 5);
      g.fill({ color: s.dress });
      g.roundRect(-bodyW / 2 - armW, headH + bodyH * 0.76, armW + 2, 4, 1);
      g.fill({ color: s.dressLuster });
      g.circle(-bodyW / 2 - armW / 2, headH + bodyH * 0.85, 3);
      g.fill({ color: s.skin });

      g.roundRect(bodyW / 2 - 2, headH + 3, armW + 2, bodyH * 0.78, 5);
      g.fill({ color: s.dress });
      g.roundRect(bodyW / 2 - 1, headH + bodyH * 0.76, armW + 2, 4, 1);
      g.fill({ color: s.dressLuster });
      g.circle(bodyW / 2 + armW / 2, headH + bodyH * 0.85, 3);
      g.fill({ color: s.skin });
    } else if (s.diplomaRaised) {
      // Right arm raised high holding blue diploma up (Scene 7, Photo 1)
      const armW = Math.round(w * 0.14);
      const armColor = s.jacket || s.dress || s.vest || s.shirt || s.skin;
      g.roundRect(-bodyW / 2 - armW + 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: armColor });
      g.circle(-bodyW / 2 - armW / 2, headH + bodyH * 0.8, armW * 0.6);
      g.fill({ color: s.skin });

      // Raised right arm
      g.roundRect(bodyW / 2 - 1, headH - 12, armW, bodyH * 0.65, 4);
      g.fill({ color: s.skin });

      // Blue Diploma with Gold Lettering «ДИПЛОМ»
      const dipX = bodyW / 2 - 4;
      const dipY = headH - 28;
      g.roundRect(dipX, dipY, 14, 20, 2);
      g.fill({ color: 0x1e3a8a });
      g.stroke({ color: 0x172554, width: 1 });
      g.rect(dipX + 2, dipY + 7, 10, 2.5);
      g.fill({ color: 0xfbbf24 });
      g.circle(dipX + 7, dipY + 13, 2);
      g.fill({ color: 0xf59e0b });
    } else if (s.diplomaFront) {
      // Both arms bent towards center holding blue diploma right in front of chest (Scene 7, Photo 1)
      const armW = Math.round(w * 0.14);
      const armColor = s.jacket || s.dress || s.skin;
      g.roundRect(-bodyW / 2 - 2, headH + 8, armW + 5, armW + 2, 3);
      g.fill({ color: armColor });
      g.roundRect(bodyW / 2 - armW - 3, headH + 8, armW + 5, armW + 2, 3);
      g.fill({ color: armColor });

      // Blue Diploma with Gold Lettering «ДИПЛОМ»
      const dipX = -8;
      const dipY = headH + 7;
      g.roundRect(dipX, dipY, 16, 22, 2);
      g.fill({ color: 0x1e3a8a });
      g.stroke({ color: 0x172554, width: 1 });
      g.rect(dipX + 3, dipY + 8, 10, 2.5);
      g.fill({ color: 0xfbbf24 });
      g.circle(dipX + 8, dipY + 14, 2);
      g.fill({ color: 0xf59e0b });
    } else {
      const armColor = (s.isMedStudent || s.isLabCoat) ? 0xffffff : (s.jacket || s.dress || s.shirt);
      g.roundRect(-bodyW / 2 - armW + 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: armColor });
      g.roundRect(bodyW / 2 - 1, headH + 4, armW, bodyH * 0.75, 4);
      g.fill({ color: armColor });

      const handColor = s.hasBlackGloves ? 0x1f2428 : s.skin;
      g.circle(-bodyW / 2 - armW / 2, headH + bodyH * 0.8, armW * 0.6);
      g.fill({ color: handColor });
      g.circle(bodyW / 2 + armW / 2, headH + bodyH * 0.8, armW * 0.6);
      g.fill({ color: handColor });

      // Student record book (зачётка)
      if (s.hasBook) {
        g.roundRect(bodyW / 2 - 3, headH + bodyH * 0.35, 11, 15, 2);
        g.fill({ color: 0x1d4ed8 });
        g.stroke({ color: 0xfbbf24, width: 0.8 });
      }

      // Dental tool (inspection mirror)
      if (s.hasDentalTool) {
        g.rect(bodyW / 2 + armW / 2 - 1, headH + bodyH * 0.45, 2, 14);
        g.fill({ color: 0x94a3b8 });
        g.circle(bodyW / 2 + armW / 2, headH + bodyH * 0.45 - 2, 3.5);
        g.stroke({ color: 0x94a3b8, width: 1.2 });
      }
    }

    // Champagne Flute for party characters
    if (s.hasChampagne) {
      const fx = bodyW / 2 + 5;
      const fy = headH + bodyH * 0.68;
      g.rect(fx + 2, fy + 7, 1.2, 8);
      g.fill({ color: 0xffffff, alpha: 0.8 });
      g.roundRect(fx, fy + 15, 5, 1.5, 0.5);
      g.fill({ color: 0xffffff, alpha: 0.8 });
      g.roundRect(fx, fy, 5, 8, 1);
      g.fill({ color: 0xfef08a, alpha: 0.85 });
      g.stroke({ color: 0xffffff, alpha: 0.9, width: 0.8 });
      g.circle(fx + 2.5, fy + 3, 1);
      g.fill({ color: 0xfffbeb });
    }

    // 3. Head & Face
    // Head back hair
    g.roundRect(-headW / 2 - 2, 0, headW + 4, headH * 0.75, 8);
    g.fill({ color: s.hair });

    // Updo hairstyle for Olesya in silver dress (Scene 7b, Photo 2)
    if (s.isUpdoHair) {
      g.circle(0, -6, headW * 0.32);
      g.fill({ color: s.hair });
      // Soft loose curls draping down on both sides of face
      g.roundRect(-headW / 2 - 3, headH * 0.32, 4, headH * 0.7, 2);
      g.fill({ color: s.hair });
      g.roundRect(headW / 2 - 1, headH * 0.32, 4, headH * 0.7, 2);
      g.fill({ color: s.hair });
    }

    // Voluminous curls for Anya
    if (s.hasCurlyHair) {
      g.circle(-headW / 2 - 1, headH * 0.2, 5); g.fill({ color: s.hair });
      g.circle(-headW / 2 - 2, headH * 0.45, 5.5); g.fill({ color: s.hair });
      g.circle(headW / 2 + 1, headH * 0.2, 5); g.fill({ color: s.hair });
      g.circle(headW / 2 + 2, headH * 0.45, 5.5); g.fill({ color: s.hair });
    }

    // Cascading curls for Lesya 16 and Prom
    if (s.isLesya16 || s.isProm) {
      g.roundRect(-headW / 2 - 4, headH * 0.3, 5, headH * 0.82, 3);
      g.fill({ color: s.hair });
      g.roundRect(headW / 2 - 1, headH * 0.3, 5, headH * 0.82, 3);
      g.fill({ color: s.hair });
    }

    // Golden prom hair ornament
    if (s.isProm) {
      g.circle(-headW / 2 + 3, headH * 0.15, 3);
      g.fill({ color: 0xffd56b });
      // Golden necklace
      g.arc(0, headH + 1, 6, 0.2, Math.PI - 0.2);
      g.stroke({ color: 0xffd56b, width: 1.5 });
    }

    // Face skin
    g.roundRect(-headW / 2, headH * 0.22, headW, headH * 0.78, 6);
    g.fill({ color: s.skin });

    // Front Hair / Bangs
    g.roundRect(-headW / 2, 0, headW, headH * 0.38, 6);
    g.fill({ color: s.hair });

    if (s.hasHairBangs) {
      g.rect(-headW / 2 + 3, headH * 0.35, headW - 6, 4);
      g.fill({ color: s.hair });
    }

    // White Medical Cap for Med Students (Scene 5)
    if (s.isMedStudent) {
      g.roundRect(-headW / 2 - 2, -6, headW + 4, headH * 0.42, 3);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0xd0dae5, width: 1 });
      const crossCol = s.isOlesyaMed ? 0x16824f : 0xd62828;
      g.rect(-1, -3, 2, 7);
      g.fill({ color: crossCol });
      g.rect(-3.5, -0.5, 7, 2);
      g.fill({ color: crossCol });
    }

    // Stethoscope around neck
    if (s.hasStethoscope) {
      g.arc(0, headH + 4, 8, 0, Math.PI);
      g.stroke({ color: 0x2b4c6f, width: 1.6 });
      g.circle(0, headH + 14, 2.5);
      g.fill({ color: 0x94a3b8 });
    }

    // Eyes
    const eyeY = headH * 0.52;
    const eyeSpacing = Math.round(headW * 0.24);
    g.circle(-eyeSpacing, eyeY, 2);
    g.fill({ color: 0x1f1b24 });
    g.circle(eyeSpacing, eyeY, 2);
    g.fill({ color: 0x1f1b24 });

    // Glasses for Anya
    if (s.hasGlasses) {
      g.roundRect(-eyeSpacing - 3.5, eyeY - 3.5, 7, 7, 2);
      g.stroke({ color: 0x1f2937, width: 1.2 });
      g.roundRect(eyeSpacing - 3.5, eyeY - 3.5, 7, 7, 2);
      g.stroke({ color: 0x1f2937, width: 1.2 });
      g.rect(-eyeSpacing + 3.5, eyeY, eyeSpacing * 2 - 7, 1);
      g.fill({ color: 0x1f2937 });
    }

    // Rosy cheeks
    const blushAlpha = (s.isPashka || s.isLesya16 || s.isProm) ? 0.7 : 0.5;
    g.circle(-eyeSpacing - 3, eyeY + 5, 2.5);
    g.fill({ color: 0xff8899, alpha: blushAlpha });
    g.circle(eyeSpacing + 3, eyeY + 5, 2.5);
    g.fill({ color: 0xff8899, alpha: blushAlpha });

    // Mustache for Dad or open mouth for Dental Patient
    if (s.isPatient) {
      g.ellipse(0, eyeY + 7, 3.5, 5);
      g.fill({ color: 0x661824 });
      g.ellipse(0, eyeY + 8, 2.5, 3);
      g.fill({ color: 0xaa2233 });
    } else if (s.hasMustache) {
      g.roundRect(-8, eyeY + 6, 16, 4, 2);
      g.fill({ color: s.mustache || s.hair });
    } else {
      g.arc(0, eyeY + 4, 3, 0.2, Math.PI - 0.2);
      g.stroke({ color: 0xaa5555, width: 1.2 });
    }

    // Ukulele for School Lesya (Scene 2)
    if (s.hasUkulele) {
      const uX = 2;
      const uY = headH + bodyH * 0.35;
      g.ellipse(uX, uY + 8, 9, 13);
      g.fill({ color: 0xb56c35 });
      g.stroke({ color: 0x733f19, width: 1 });
      g.circle(uX, uY + 7, 3);
      g.fill({ color: 0x3d200e });
      g.rect(uX - 2, uY - 9, 4, 12);
      g.fill({ color: 0xd4945d });
      g.roundRect(uX - 3.5, uY - 14, 7, 6, 2);
      g.fill({ color: 0x733f19 });
    }

    // White Hair Bows for First Graders (Scene 01b)
    if (s.hasWhiteBows) {
      g.circle(-headW * 0.44, headH * 0.2, 5.5);
      g.fill({ color: 0xffffff });
      g.circle(-headW * 0.44, headH * 0.2, 2.5);
      g.fill({ color: 0xf0f0fa });
      g.circle(headW * 0.44, headH * 0.2, 5.5);
      g.fill({ color: 0xffffff });
      g.circle(headW * 0.44, headH * 0.2, 2.5);
      g.fill({ color: 0xf0f0fa });
    }

    // Festive Flower Bouquet (Scene 01b)
    if (s.hasBouquet) {
      const bqX = bodyW * 0.32;
      const bqY = headH + bodyH * 0.35;
      // Stems & cone wrap
      g.poly([bqX - 3, bqY + 12, bqX + 7, bqY + 10, bqX + 3, bqY - 2, bqX - 7, bqY - 2]);
      g.fill({ color: 0x4a934a });
      // Colorful floral blooms (gladioli, marigolds, asters)
      g.circle(bqX - 4, bqY - 4, 4.5);
      g.fill({ color: 0xff3b6f });
      g.circle(bqX + 4, bqY - 3, 4.5);
      g.fill({ color: 0xffaa00 });
      g.circle(bqX, bqY - 8, 4);
      g.fill({ color: 0xffffff });
      g.circle(bqX + 2, bqY - 11, 3.5);
      g.fill({ color: 0xdf55a0 });
    }

    // Camera for Photographer (Scene 01b)
    if (s.isPhotographer) {
      const camX = 0;
      const camY = headH + bodyH * 0.28;
      // Camera body
      g.roundRect(camX - 9, camY - 5, 18, 12, 2);
      g.fill({ color: 0x1f232b });
      g.stroke({ color: 0x485263, width: 0.8 });
      // Lens
      g.circle(camX, camY + 1, 5);
      g.fill({ color: 0x111317 });
      g.stroke({ color: 0x6e84a3, width: 1.2 });
      g.circle(camX + 1.5, camY - 0.5, 1.5);
      g.fill({ color: 0x89c4f4, alpha: 0.8 });
      // Red tally / flash LED
      g.circle(camX + 6, camY - 3, 1);
      g.fill({ color: 0xff2222 });
      // Hands holding camera
      g.roundRect(camX - 12, camY - 2, 4, 7, 2);
      g.fill({ color: s.skin });
      g.roundRect(camX + 8, camY - 2, 4, 7, 2);
      g.fill({ color: s.skin });
    }
  }

  drawCatBlock(g, w, h, s) {
    const catW = Math.round(w * 0.95);
    const catH = Math.round(h * 0.88);

    // 1. Base Snow-White Body
    g.roundRect(-catW / 2, h - catH * 0.65, catW, catH * 0.65, 8);
    g.fill({ color: s.furWhite });

    // 2. Calico Flank & Spine Markings
    g.roundRect(-catW * 0.48, h - catH * 0.62, catW * 0.45, catH * 0.55, 6);
    g.fill({ color: s.furOrange });

    g.roundRect(-catW * 0.16, h - catH * 0.65, catW * 0.42, catH * 0.32, 4);
    g.fill({ color: s.furDark });

    // 3. Cat Head
    const headSize = Math.round(catW * 0.72);
    const headY = h - catH * 0.65 - headSize * 0.65;
    g.roundRect(-headSize / 2, headY, headSize, headSize, 8);
    g.fill({ color: s.furWhite });

    g.roundRect(-headSize / 2, headY, headSize * 0.44, headSize * 0.42, 4);
    g.fill({ color: s.furOrange });

    g.roundRect(headSize * 0.08, headY, headSize * 0.42, headSize * 0.35, 4);
    g.fill({ color: s.furDark });

    g.roundRect(-headSize * 0.25, headY + headSize * 0.35, headSize * 0.5, headSize * 0.6, 4);
    g.fill({ color: s.furWhite });

    // 4. Ears
    g.poly([-headSize / 2 + 2, headY + 2, -headSize / 2 + 7, headY - 8, -headSize / 2 + 12, headY + 2]);
    g.fill({ color: s.furOrange });

    g.poly([headSize / 2 - 12, headY + 2, headSize / 2 - 7, headY - 8, headSize / 2 - 2, headY + 2]);
    g.fill({ color: s.furDark });

    g.poly([-headSize / 2 + 4, headY + 1, -headSize / 2 + 7, headY - 5, -headSize / 2 + 10, headY + 1]);
    g.fill({ color: 0xffb8b8 });
    g.poly([headSize / 2 - 10, headY + 1, headSize / 2 - 7, headY - 5, headSize / 2 - 4, headY + 1]);
    g.fill({ color: 0xffb8b8 });

    // 5. Golden-Amber Eyes
    const eyeY = headY + headSize * 0.42;
    g.circle(-headSize * 0.22, eyeY, 2.8);
    g.fill({ color: s.eyes });
    g.circle(-headSize * 0.22, eyeY, 1.2);
    g.fill({ color: 0x1a1208 });
    g.circle(headSize * 0.22, eyeY, 2.8);
    g.fill({ color: s.eyes });
    g.circle(headSize * 0.22, eyeY, 1.2);
    g.fill({ color: 0x1a1208 });

    // 6. Cute Pink Nose
    g.poly([-2, eyeY + 6, 2, eyeY + 6, 0, eyeY + 9]);
    g.fill({ color: s.nose });

    // 7. Whiskers
    g.moveTo(-headSize * 0.25, eyeY + 7);
    g.lineTo(-headSize * 0.55, eyeY + 5);
    g.stroke({ color: 0xd8d8d8, width: 0.8 });
    g.moveTo(headSize * 0.25, eyeY + 7);
    g.lineTo(headSize * 0.55, eyeY + 5);
    g.stroke({ color: 0xd8d8d8, width: 0.8 });

    // 8. Fluffy Calico Tail
    g.arc(catW / 2 + 3, h - 14, 11, -Math.PI / 2, Math.PI / 2);
    g.stroke({ color: s.furOrange, width: 4.5 });
    g.arc(catW / 2 + 3, h - 18, 11, -Math.PI / 2, -Math.PI / 4);
    g.stroke({ color: s.furDark, width: 4.5 });
  }

  async initSprite(url) {
    try {
      const texture = await Assets.load(url);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 1);

      const aspect = texture.width / texture.height;
      sprite.height = this.charHeight;
      sprite.width = this.charHeight * aspect;
      sprite.y = this.charHeight;
      if (this.flipX) {
        sprite.scale.x = -Math.abs(sprite.scale.x);
      }

      this.bodyContainer.addChild(sprite);
      this.sprite = sprite;
    } catch (e) {
      console.warn(`Failed to load texture ${url}, fallback to block`, e);
      this.createBlockCharacter(this.charType);
    }
  }

  onClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    Haptics.light();
    soundManager.playTap();
    
    // Jump animation (safely halt and reset previous tween to prevent sticking in the air)
    if (this.jumpTween) {
      this.jumpTween.stop();
      this.jumpTween = null;
    }
    this.bodyContainer.y = -this.charHeight;

    this.jumpTween = new TWEEN.Tween(this.bodyContainer)
      .to({ y: -this.charHeight - 14 }, 140)
      .yoyo(true)
      .repeat(1)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.bodyContainer.y = -this.charHeight;
        this.jumpTween = null;
      })
      .onStop(() => {
        this.bodyContainer.y = -this.charHeight;
        this.jumpTween = null;
      })
      .start();

    // Show Speech Bubble directly over the head & name badge
    const globalPos = this.toGlobal({ x: 0, y: -this.charHeight - 24 + (this.badgeOffsetY || 0) });
    DialogBubble.show(this.speakerTitle, this.dialogueText, globalPos.x, globalPos.y);
  }

  update(delta) {
    // Characters stand firmly grounded on the surface without floating or breathing jitter
    if (this.bodyContainer && this.bodyContainer.scale.y !== 1) {
      this.bodyContainer.scale.set(1.0);
    }
  }
}
