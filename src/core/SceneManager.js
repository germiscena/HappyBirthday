import { Container } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { DialogBubble } from '../ui/DialogBubble.js';
import { Scene01_HomeFamily } from '../scenes/Scene01_HomeFamily.js';
import { Scene01b_FirstGrade } from '../scenes/Scene01b_FirstGrade.js';
import { Scene02_SchoolYears } from '../scenes/Scene02_SchoolYears.js';
import { Scene03_FirstMeeting } from '../scenes/Scene03_FirstMeeting.js';
import { Scene04_GraduationProm } from '../scenes/Scene04_GraduationProm.js';
import { Scene05_MedicalUniversity } from '../scenes/Scene05_MedicalUniversity.js';
import { Scene06_DentalClinic } from '../scenes/Scene06_DentalClinic.js';
import { Scene07_GraduationDiplomas } from '../scenes/Scene07_GraduationDiplomas.js';
import { Scene07b_GraduationParty } from '../scenes/Scene07b_GraduationParty.js';
import { Scene08_BirthdayCake } from '../scenes/Scene08_BirthdayCake.js';

export class SceneManager {
  constructor(app, stage) {
    this.app = app;
    this.stage = stage;
    this.container = new Container();
    this.stage.addChild(this.container);

    this.scenes = new Map();
    this.currentScene = null;
    this.isTransitioning = false;

    // Register initial scenes
    this.register('scene01', new Scene01_HomeFamily());
    this.register('scene01b', new Scene01b_FirstGrade());
    this.register('scene02', new Scene02_SchoolYears());
    this.register('scene03', new Scene03_FirstMeeting());
    this.register('scene04', new Scene04_GraduationProm());
    this.register('scene05', new Scene05_MedicalUniversity());
    this.register('scene06', new Scene06_DentalClinic());
    this.register('scene07', new Scene07_GraduationDiplomas());
    this.register('scene07b', new Scene07b_GraduationParty());
    this.register('scene08', new Scene08_BirthdayCake());
  }

  register(id, sceneInstance) {
    this.scenes.set(id, sceneInstance);
  }

  async loadScene(sceneId) {
    if (this.isTransitioning) return;
    if (this.currentScene && this.currentScene.id === sceneId) return;

    this.isTransitioning = true;
    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      console.warn(`Scene ${sceneId} not found`);
      this.isTransitioning = false;
      return;
    }

    try {
      // 0. Dismiss any open dialog bubble from previous scene
      DialogBubble.hide();

      // 1. Notify leave & fade out current scene if any
      if (this.currentScene) {
        if (typeof this.currentScene.onLeave === 'function') {
          this.currentScene.onLeave();
        }
        await this.currentScene.fadeOut(350);
        this.container.removeChild(this.currentScene);
      }

      // 2. Init and add next scene
      if (!nextScene.isInitialized) {
        await nextScene.init();
        nextScene.isInitialized = true;
      }

      this.container.addChild(nextScene);
      this.currentScene = nextScene;

      if (typeof nextScene.onEnter === 'function') {
        nextScene.onEnter();
      }

      // 3. Fade in next scene
      await nextScene.fadeIn(450);
    } catch (err) {
      console.error(`Error loading scene ${sceneId}:`, err);
    } finally {
      this.isTransitioning = false;
    }
  }

  update(delta) {
    if (this.currentScene) {
      this.currentScene.update(delta);
    }
  }
}
