// Male / JARVIS Voice Speech Engine for HOLMEV
// Tuned for deep, calm, British/Male AI Assistant demeanor (Addressing "Mister Memon" / "Boss")

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private preferredMaleVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prioritize sophisticated Male JARVIS voices
    const maleVoiceNames = [
      'google uk english male',
      'microsoft david',
      'microsoft george',
      'microsoft mark',
      'google us english male',
      'daniel',
      'alex',
      'oliver',
      'rishi',
    ];

    // 1. Search for known male voices
    for (const name of maleVoiceNames) {
      const match = voices.find((v) => v.name.toLowerCase().includes(name));
      if (match) {
        this.preferredMaleVoice = match;
        return;
      }
    }

    // 2. Search for any English voice with "Male" in description/name
    const anyMale = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george'))
    );
    if (anyMale) {
      this.preferredMaleVoice = anyMale;
      return;
    }

    // 3. Fallback to British English or US English
    const gbVoice = voices.find((v) => v.lang === 'en-GB') || voices.find((v) => v.lang.startsWith('en'));
    this.preferredMaleVoice = gbVoice || voices[0];
  }

  // Speak text using browser speech synthesis in JARVIS Male tone
  public speak(text: string, _lang: 'roman_urdu' | 'urdu' | 'english' | 'hindi' = 'roman_urdu') {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Cancel any overlapping speech immediately

      // Remove markdown artifacts or special characters before speaking
      const cleanText = text
        .replace(/[*_#`~[\]()><]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Deep, clear, refined male pitch (JARVIS style)
      utterance.rate = 1.0;
      utterance.pitch = 0.88; // Deep male pitch

      if (!this.preferredMaleVoice) {
        this.initVoices();
      }

      if (this.preferredMaleVoice) {
        utterance.voice = this.preferredMaleVoice;
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
      this.isSpeaking = false;
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
