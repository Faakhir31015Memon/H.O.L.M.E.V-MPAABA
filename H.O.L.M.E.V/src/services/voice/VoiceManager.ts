/**
 * H.O.L.M.E.V VoiceManager — Single Authoritative Voice Authority
 *
 * Rules:
 * - Only ONE SpeechRecognition instance ever exists
 * - Only ONE TTS utterance plays at a time
 * - Mic is muted/paused while HOLMEV is speaking (prevents echo loop)
 * - Barge-in: audio level spike during TTS → stop TTS → listen
 * - VAD silence threshold is configurable (default 1500ms)
 * - Real audio level monitoring via AnalyserNode
 * - Full cleanup on destroy()
 */

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'ERROR'
  | 'DEACTIVATED';

export type VoiceEventType =
  | 'state_changed'
  | 'transcript_interim'
  | 'transcript_final'
  | 'audio_level'
  | 'speaking_started'
  | 'speaking_ended'
  | 'error'
  | 'mic_permission_denied'
  | 'mic_disconnected';

export interface VoiceEvent {
  type: VoiceEventType;
  state?: VoiceState;
  transcript?: string;
  level?: number; // 0-1 audio level
  error?: string;
}

export interface VoiceManagerConfig {
  silenceThresholdMs?: number; // default 1500ms
  language?: string; // default 'en-US'
  pitchOverride?: number; // 0.1-2.0
  rateOverride?: number; // 0.1-2.0
  bargeInLevelThreshold?: number; // 0-1 mic level during TTS to trigger barge-in, default 0.15
  onEvent?: (event: VoiceEvent) => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

export class VoiceManager {
  private state: VoiceState = 'IDLE';
  private config: Required<VoiceManagerConfig>;

  // Speech Recognition (STT)
  private recognition: SpeechRecognitionInstance | null = null;
  private recognitionActive = false;
  private shouldContinuouslyListen = false;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  // TTS
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  // Audio Level Monitoring (AnalyserNode)
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private levelBuffer: Float32Array | null = null;
  private levelAnimFrame: number | null = null;

  // Barge-in detection while speaking
  private bargeInListenerActive = false;
  private bargeInStream: MediaStream | null = null;
  private bargeInAnalyser: AnalyserNode | null = null;
  private bargeInBuffer: Float32Array | null = null;
  private bargeInFrame: number | null = null;

  // Track whether we initialized mic
  private micPermissionGranted = false;

  constructor(config: VoiceManagerConfig = {}) {
    this.config = {
      silenceThresholdMs: config.silenceThresholdMs ?? 1500,
      language: config.language ?? 'en-US',
      pitchOverride: config.pitchOverride ?? 0.88,
      rateOverride: config.rateOverride ?? 1.0,
      bargeInLevelThreshold: config.bargeInLevelThreshold ?? 0.15,
      onEvent: config.onEvent ?? (() => {}),
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────

  public getState(): VoiceState {
    return this.state;
  }

  public setLanguage(lang: string) {
    this.config.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public setConfig(partial: Partial<VoiceManagerConfig>) {
    this.config = { ...this.config, ...partial };
  }

  /** Start continuous listening session */
  public async startListening(): Promise<boolean> {
    if (this.state === 'DEACTIVATED') return false;

    this.shouldContinuouslyListen = true;

    const ok = await this.initMicStream();
    if (!ok) return false;

    this.setState('LISTENING');
    this.beginRecognition();
    return true;
  }

  /** Stop listening and enter DEACTIVATED state */
  public stopListening() {
    this.shouldContinuouslyListen = false;
    this.stopRecognition();
    this.stopAudioLevel();
    this.setState('DEACTIVATED');
  }

  /** Temporarily pause mic (during TTS) without full deactivation */
  public pauseListening() {
    this.stopRecognition();
  }

  /** Resume mic after TTS ends (only if shouldContinuouslyListen) */
  public resumeListening() {
    if (!this.shouldContinuouslyListen) return;
    if (this.state === 'DEACTIVATED') return;
    this.setState('LISTENING');
    this.beginRecognition();
  }

  /** Mark state as THINKING (AI processing) */
  public setThinking() {
    this.stopRecognition();
    this.setState('THINKING');
  }

  /** Mark state as EXECUTING (tool running) */
  public setExecuting() {
    this.setState('EXECUTING');
  }

  /**
   * Speak text. Cancels any existing speech first.
   * Pauses mic during TTS to prevent echo.
   * Auto-resumes mic after speaking if session is active.
   */
  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    // Cancel any previous speech immediately
    this.stopSpeaking();

    // Stop mic while speaking
    this.pauseListening();

    // Start barge-in monitor
    this.startBargeInMonitor();

    const cleanText = this.cleanForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      this.onSpeakingEnded(onEnd);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = this.config.pitchOverride;
    utterance.rate = this.config.rateOverride;

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    utterance.onstart = () => {
      this.setState('SPEAKING');
      this.emit({ type: 'speaking_started' });
    };

    utterance.onend = () => {
      this.onSpeakingEnded(onEnd);
    };

    utterance.onerror = () => {
      this.onSpeakingEnded(onEnd);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /** Stop any current TTS immediately */
  public stopSpeaking() {
    this.stopBargeInMonitor();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.state === 'SPEAKING';
  }

  public isListening(): boolean {
    return this.state === 'LISTENING';
  }

  /** Get current real-time audio level (0-1). Returns 0 if mic is off. */
  public getAudioLevel(): number {
    if (!this.analyser || !this.levelBuffer) return 0;
    this.analyser.getFloatTimeDomainData(this.levelBuffer);
    let sum = 0;
    for (let i = 0; i < this.levelBuffer.length; i++) {
      sum += Math.abs(this.levelBuffer[i]);
    }
    return Math.min(1, (sum / this.levelBuffer.length) * 8);
  }

  /** List available audio input devices */
  public async listMicDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }

  /** Full cleanup — call on component unmount */
  public destroy() {
    this.shouldContinuouslyListen = false;
    this.stopSpeaking();
    this.stopRecognition();
    this.stopAudioLevel();
    this.stopBargeInMonitor();
    this.releaseMicStream();
    this.closeAudioContext();
  }

  // ─────────────────────────────────────────────────────────
  // Internal — State
  // ─────────────────────────────────────────────────────────

  private setState(s: VoiceState) {
    if (this.state === s) return;
    this.state = s;
    this.emit({ type: 'state_changed', state: s });
  }

  private emit(event: VoiceEvent) {
    try {
      this.config.onEvent(event);
    } catch {
      // never let event handler crash VoiceManager
    }
  }

  // ─────────────────────────────────────────────────────────
  // Internal — Mic & Audio Level
  // ─────────────────────────────────────────────────────────

  private async initMicStream(): Promise<boolean> {
    if (this.micStream && this.micPermissionGranted) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micStream = stream;
      this.micPermissionGranted = true;
      this.setupAnalyser(stream);
      return true;
    } catch (err) {
      const isDenied = err instanceof Error && err.name === 'NotAllowedError';
      this.setState('ERROR');
      this.emit({
        type: isDenied ? 'mic_permission_denied' : 'error',
        error: isDenied ? 'Microphone permission denied' : 'Microphone unavailable',
      });
      return false;
    }
  }

  private setupAnalyser(stream: MediaStream) {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.micSource) {
        try { this.micSource.disconnect(); } catch { /* ignore */ }
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.levelBuffer = new Float32Array(this.analyser.fftSize);

      this.micSource = this.audioContext.createMediaStreamSource(stream);
      this.micSource.connect(this.analyser);
      // Note: analyser NOT connected to destination — mic audio not played back

      this.startAudioLevel();
    } catch {
      // AudioContext not available — graceful degradation
    }
  }

  private startAudioLevel() {
    this.stopAudioLevel();
    const tick = () => {
      const level = this.getAudioLevel();
      this.emit({ type: 'audio_level', level });
      this.levelAnimFrame = requestAnimationFrame(tick);
    };
    this.levelAnimFrame = requestAnimationFrame(tick);
  }

  private stopAudioLevel() {
    if (this.levelAnimFrame !== null) {
      cancelAnimationFrame(this.levelAnimFrame);
      this.levelAnimFrame = null;
    }
  }

  private releaseMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch { /* ignore */ }
      this.micSource = null;
    }
    this.micPermissionGranted = false;
  }

  private closeAudioContext() {
    if (this.audioContext) {
      try { this.audioContext.close(); } catch { /* ignore */ }
      this.audioContext = null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Internal — Speech Recognition
  // ─────────────────────────────────────────────────────────

  private beginRecognition() {
    // Guard: never create a second recognition while one is active
    if (this.recognitionActive) return;

    const SpeechRecognitionCtor = this.getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      this.emit({ type: 'error', error: 'SpeechRecognition API not supported in this browser' });
      return;
    }

    // Abort previous instance cleanly
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }

    const rec = new SpeechRecognitionCtor();
    rec.lang = this.config.language;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false; // We handle restart ourselves for better control

    rec.onstart = () => {
      this.recognitionActive = true;
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0]?.transcript ?? '';
        if (r.isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (interim) {
        this.emit({ type: 'transcript_interim', transcript: interim });
      }
      if (final.trim()) {
        this.emit({ type: 'transcript_final', transcript: final.trim() });
      }
    };

    rec.onerror = () => {
      this.recognitionActive = false;
      if (this.shouldContinuouslyListen) {
        this.scheduleRestart(1200);
      }
    };

    rec.onend = () => {
      this.recognitionActive = false;
      // Auto-restart if continuous mode and not in SPEAKING/THINKING/EXECUTING state
      if (
        this.shouldContinuouslyListen &&
        this.state === 'LISTENING'
      ) {
        this.scheduleRestart(400);
      }
    };

    try {
      rec.start();
      this.recognition = rec;
    } catch {
      this.recognitionActive = false;
      if (this.shouldContinuouslyListen) {
        this.scheduleRestart(1200);
      }
    }
  }

  private scheduleRestart(delayMs: number) {
    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = setTimeout(() => {
      this.restartTimeout = null;
      if (this.shouldContinuouslyListen && this.state === 'LISTENING') {
        this.beginRecognition();
      }
    }, delayMs);
  }

  private stopRecognition() {
    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
      this.recognition = null;
    }
    this.recognitionActive = false;
  }

  private getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }

  // ─────────────────────────────────────────────────────────
  // Internal — TTS
  // ─────────────────────────────────────────────────────────

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices.length) return;

    const preferred = [
      'google uk english male',
      'microsoft david',
      'microsoft george',
      'microsoft mark',
      'daniel',
      'oliver',
      'rishi',
      'alex',
    ];

    for (const name of preferred) {
      const match = voices.find((v) => v.name.toLowerCase().includes(name));
      if (match) {
        this.preferredVoice = match;
        return;
      }
    }

    // Any English male voice
    const anyMale = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('george'))
    );
    if (anyMale) { this.preferredVoice = anyMale; return; }

    // British English fallback
    const gb = voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en'));
    this.preferredVoice = gb ?? voices[0] ?? null;
  }

  private cleanForSpeech(text: string): string {
    return text
      .replace(/[*_#`~[\]()<>]/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private onSpeakingEnded(onEnd?: () => void) {
    this.stopBargeInMonitor();
    this.currentUtterance = null;
    this.emit({ type: 'speaking_ended' });
    onEnd?.();

    // Auto-resume listening after speaking
    if (this.shouldContinuouslyListen) {
      // Small delay to avoid picking up room echo of our own voice
      setTimeout(() => this.resumeListening(), 500);
    } else {
      this.setState('IDLE');
    }
  }

  // ─────────────────────────────────────────────────────────
  // Internal — Barge-in Detection
  // ─────────────────────────────────────────────────────────

  private async startBargeInMonitor() {
    if (this.bargeInListenerActive) return;
    if (!this.micPermissionGranted) return;

    try {
      this.bargeInListenerActive = true;
      // Reuse existing mic stream if available
      const stream = this.micStream ?? await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      this.bargeInStream = stream;

      const ctx = this.audioContext ?? new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);

      this.bargeInAnalyser = analyser;
      this.bargeInBuffer = new Float32Array(analyser.fftSize);

      const check = () => {
        if (!this.bargeInListenerActive) return;
        if (!this.bargeInAnalyser || !this.bargeInBuffer) return;

        this.bargeInAnalyser.getFloatTimeDomainData(this.bargeInBuffer);
        let sum = 0;
        for (let i = 0; i < this.bargeInBuffer.length; i++) {
          sum += Math.abs(this.bargeInBuffer[i]);
        }
        const level = Math.min(1, (sum / this.bargeInBuffer.length) * 8);

        if (level > this.config.bargeInLevelThreshold && this.state === 'SPEAKING') {
          // Barge-in detected!
          this.stopSpeaking();
          this.setState('INTERRUPTED');
          setTimeout(() => {
            if (this.shouldContinuouslyListen) {
              this.setState('LISTENING');
              this.beginRecognition();
            }
          }, 150);
          return;
        }

        this.bargeInFrame = requestAnimationFrame(check);
      };
      this.bargeInFrame = requestAnimationFrame(check);
    } catch {
      this.bargeInListenerActive = false;
    }
  }

  private stopBargeInMonitor() {
    this.bargeInListenerActive = false;
    if (this.bargeInFrame !== null) {
      cancelAnimationFrame(this.bargeInFrame);
      this.bargeInFrame = null;
    }
    this.bargeInAnalyser = null;
    this.bargeInBuffer = null;
    // Don't stop the stream here — it may be shared with micStream
    this.bargeInStream = null;
  }
}

/** Singleton — the ONE voice authority for the entire application */
export const voiceManager = new VoiceManager();
