import { Config } from '../app/Config.js';
import { soundManager } from '../audio/SoundManager.js';

export class TimelineController {
  constructor(onChange) {
    this.currentIndex = 0;
    this.milestones = Config.TIMELINE;
    this.onChange = onChange;
    this.isTransitioning = false;
  }

  getCurrentMilestone() {
    return this.milestones[this.currentIndex];
  }

  canGoBack() {
    return this.currentIndex > 0 && !this.isTransitioning;
  }

  canGoForward() {
    return this.currentIndex < this.milestones.length - 1 && !this.isTransitioning;
  }

  goBack() {
    if (!this.canGoBack()) return;
    soundManager.playClick();
    this.setIndex(this.currentIndex - 1);
  }

  goForward() {
    if (!this.canGoForward()) return;
    soundManager.playClick();
    this.setIndex(this.currentIndex + 1);
  }

  async setIndex(index) {
    if (this.isTransitioning) return;
    if (index < 0 || index >= this.milestones.length || index === this.currentIndex) return;
    this.currentIndex = index;
    if (this.onChange) {
      await this.onChange(this.getCurrentMilestone(), this.currentIndex);
    }
  }
}
