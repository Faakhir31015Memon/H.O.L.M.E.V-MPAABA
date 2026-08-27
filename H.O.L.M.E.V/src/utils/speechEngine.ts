// Multilingual Speech Engine for HOLMEV

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Speak text using browser speech synthesis in appropriate accent
  public speak(text: string, lang: 'roman_urdu' | 'urdu' | 'english' | 'hindi' = 'roman_urdu') {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop prior speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Find best voice match
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        if (lang === 'urdu') {
          const urduVoice = voices.find((v) => v.lang.startsWith('ur'));
          if (urduVoice) utterance.voice = urduVoice;
        } else if (lang === 'hindi' || lang === 'roman_urdu') {
          const hiVoice = voices.find((v) => v.lang.startsWith('hi') || v.lang.includes('India'));
          if (hiVoice) utterance.voice = hiVoice;
        } else {
          const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
          if (enVoice) utterance.voice = enVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechEngine = new SpeechEngine();
