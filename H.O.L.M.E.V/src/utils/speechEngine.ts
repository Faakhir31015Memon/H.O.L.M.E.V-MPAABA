// Male / JARVIS Voice Speech Engine Adapter for H.O.L.M.E.V
// Delegates to the centralized VoiceManager singleton to guarantee single TTS authority and prevent voice overlaps

import { voiceManager } from '../services/voice/VoiceManager';

class SpeechEngineAdapter {
  public speak(text: string, onEnd?: () => void) {
    voiceManager.speak(text, onEnd);
  }

  public stop() {
    voiceManager.stopSpeaking();
  }

  public getIsSpeaking(): boolean {
    return voiceManager.isSpeaking();
  }
}

export const speechEngine = new SpeechEngineAdapter();
