/**
 * H.O.L.M.E.V Voice Session State Machine
 *
 * Manages the full lifecycle of a HOLMEV voice session:
 * IDLE → LISTENING_FOR_WAKE → ACTIVATING → ACTIVE_SESSION
 *
 * While ACTIVE_SESSION, per-utterance cycle:
 * ACTIVE_SESSION → LISTENING → THINKING → EXECUTING → SPEAKING → LISTENING
 *
 * Deactivation:
 * ACTIVE_SESSION → DEACTIVATING → IDLE
 */

export type SessionState =
  | 'IDLE'
  | 'LISTENING_FOR_WAKE'
  | 'ACTIVATING'
  | 'ACTIVE_SESSION'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'DEACTIVATING'
  | 'ERROR';

export interface SessionEvent {
  type:
    | 'session_activated'
    | 'session_deactivated'
    | 'wake_detected'
    | 'sleep_detected'
    | 'state_changed'
    | 'command_received'
    | 'barge_in';
  state?: SessionState;
  transcript?: string;
}

export type SessionEventHandler = (event: SessionEvent) => void;

// Wake phrases — any of these activate a session
const WAKE_PHRASES = [
  'chal kaam par lag ja',
  'chal kam par lag ja',
  'kaam par lag',
  'wake up',
  'activate',
  'holmev activate',
  'holmev wake',
  'start listening',
];

// Sleep phrases — any of these deactivate the session
const SLEEP_PHRASES = [
  'chal so ja',
  'so ja',
  'deactivate',
  'holmev deactivate',
  'holmev so ja',
  'sleep',
  'stop listening',
  'band ho ja',
  'tera kaam pura hua',
];

export class VoiceSessionStateMachine {
  private state: SessionState = 'IDLE';
  private handlers: SessionEventHandler[] = [];
  private isSessionActive = false;

  public getState(): SessionState {
    return this.state;
  }

  public isActive(): boolean {
    return this.isSessionActive;
  }

  public onEvent(handler: SessionEventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private emit(event: SessionEvent) {
    this.handlers.forEach((h) => {
      try { h(event); } catch { /* never let handler crash state machine */ }
    });
  }

  private setState(s: SessionState) {
    if (this.state === s) return;
    this.state = s;
    this.emit({ type: 'state_changed', state: s });
  }

  /** Check if a transcript contains a wake phrase */
  public isWakePhrase(transcript: string): boolean {
    const lower = transcript.toLowerCase().trim();
    return WAKE_PHRASES.some((p) => lower.includes(p));
  }

  /** Check if a transcript contains a sleep phrase */
  public isSleepPhrase(transcript: string): boolean {
    const lower = transcript.toLowerCase().trim();
    return SLEEP_PHRASES.some((p) => lower.includes(p));
  }

  /** Process incoming transcript — returns whether it should be sent to AI */
  public processTranscript(transcript: string): {
    isWake: boolean;
    isSleep: boolean;
    isCommand: boolean;
    shouldSendToAI: boolean;
  } {
    const isWake = this.isWakePhrase(transcript);
    const isSleep = this.isSleepPhrase(transcript);

    if (isWake && !this.isSessionActive) {
      this.activateSession();
      return { isWake: true, isSleep: false, isCommand: false, shouldSendToAI: true };
    }

    if (isSleep && this.isSessionActive) {
      this.deactivateSession();
      return { isWake: false, isSleep: true, isCommand: false, shouldSendToAI: true };
    }

    if (this.isSessionActive) {
      this.setState('LISTENING');
      this.emit({ type: 'command_received', transcript });
      return { isWake: false, isSleep: false, isCommand: true, shouldSendToAI: true };
    }

    // Not active and not a wake phrase — ignore
    return { isWake: false, isSleep: false, isCommand: false, shouldSendToAI: false };
  }

  public activateSession() {
    this.isSessionActive = true;
    this.setState('ACTIVATING');
    setTimeout(() => {
      this.setState('ACTIVE_SESSION');
      this.emit({ type: 'session_activated' });
    }, 100);
  }

  public deactivateSession() {
    this.isSessionActive = false;
    this.setState('DEACTIVATING');
    setTimeout(() => {
      this.setState('IDLE');
      this.emit({ type: 'session_deactivated' });
    }, 200);
  }

  public setThinking() {
    if (this.isSessionActive) this.setState('THINKING');
  }

  public setExecuting() {
    if (this.isSessionActive) this.setState('EXECUTING');
  }

  public setSpeaking() {
    if (this.isSessionActive) this.setState('SPEAKING');
  }

  public setListening() {
    if (this.isSessionActive) this.setState('LISTENING');
  }

  public setError(reason?: string) {
    console.warn('[VoiceStateMachine] Error:', reason);
    this.setState('ERROR');
  }

  public reset() {
    this.isSessionActive = false;
    this.setState('IDLE');
  }
}

export const voiceSession = new VoiceSessionStateMachine();
