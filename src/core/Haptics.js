/**
 * Haptic tactile feedback for mobile devices using Vibration API
 * Silently falls back if unsupported or disabled on the client.
 */
export class Haptics {
  static isSupported() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  static trigger(pattern) {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore security policy or vendor restrictions
    }
  }

  /** Light subtle tick for UI buttons, character taps, and scrubber pips */
  static light() {
    this.trigger(12);
  }

  /** Crisp tactile impact for interactive props (bell, music stand, fountain splash) */
  static medium() {
    this.trigger(28);
  }

  /** Distinct tick for horizontal timeline swipe gestures */
  static swipe() {
    this.trigger(16);
  }

  /** Celebratory vibration pattern for blowing out candles, fanfare, and diploma toss */
  static celebration() {
    this.trigger([35, 45, 60, 45, 100]);
  }
}
