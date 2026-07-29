/**
 * Spoken Loop State Machine
 * Core state machine for Phase 0 Voice Spine
 * Manages the voice interaction loop: listen → think → speak
 */

import { SpokenLoopState, SpokenLoopEvent } from './types';
import { SpeechController } from './speechController';
import { GeminiSimpleClient } from '../ai/geminiSimpleClient';

type StateListener = (state: SpokenLoopState) => void;

export class SpokenLoopMachine {
  private state: SpokenLoopState = { type: 'idle' };
  private listeners: Set<StateListener> = new Set();
  private speechController: SpeechController;
  private geminiClient: GeminiSimpleClient;
  private currentAbortController: AbortController | null = null;

  constructor(speechController: SpeechController, geminiClient: GeminiSimpleClient) {
    this.speechController = speechController;
    this.geminiClient = geminiClient;
  }

  /**
   * Handle an event and transition state accordingly
   */
  async handleEvent(event: SpokenLoopEvent): Promise<void> {
    // Validate transition
    if (!this.canTransition(event)) {
      console.warn(`Invalid transition: ${this.state.type} + ${event.type}`);
      return;
    }

    // Handle event based on current state
    switch (this.state.type) {
      case 'idle':
        if (event.type === 'START_LISTENING') {
          await this.startListening();
        }
        break;

      case 'listening':
        if (event.type === 'TRANSCRIPT_READY') {
          await this.processTranscript(event.transcript);
        } else if (event.type === 'USER_INTERRUPT') {
          this.handleInterrupt();
        } else if (event.type === 'ERROR') {
          this.handleError(event.error);
        }
        break;

      case 'thinking':
        if (event.type === 'AI_RESPONSE_READY') {
          await this.speakResponse(event.response);
        } else if (event.type === 'USER_INTERRUPT') {
          this.handleInterrupt();
        } else if (event.type === 'ERROR') {
          this.handleError(event.error);
        }
        break;

      case 'speaking':
        if (event.type === 'SPEECH_COMPLETE') {
          this.returnToIdle();
        } else if (event.type === 'USER_INTERRUPT') {
          this.handleInterrupt();
        } else if (event.type === 'ERROR') {
          this.handleError(event.error);
        }
        break;

      case 'interrupted':
        // Automatically transition to idle
        this.returnToIdle();
        break;

      case 'error':
        if (event.type === 'RESET') {
          this.returnToIdle();
        }
        break;
    }
  }

  /**
   * Start listening for user speech
   */
  private async startListening(): Promise<void> {
    this.setState({ type: 'listening' });

    try {
      const transcript = await this.speechController.startListening();

      // Check if interrupted during listening
      if (this.state.type !== 'listening') {
        return; // Interrupted, abort
      }

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No speech detected');
      }

      await this.handleEvent({
        type: 'TRANSCRIPT_READY',
        transcript,
      });
    } catch (error) {
      await this.handleEvent({
        type: 'ERROR',
        error: error as Error,
      });
    }
  }

  /**
   * Process transcript and call AI
   */
  private async processTranscript(transcript: string): Promise<void> {
    this.setState({ type: 'thinking', transcript });

    // Create abort controller for this request
    this.currentAbortController = new AbortController();

    try {
      const response = await this.geminiClient.chat(
        transcript,
        this.currentAbortController.signal
      );

      // Check if interrupted during API call
      if (this.state.type !== 'thinking') {
        return; // Interrupted, abort
      }

      await this.handleEvent({
        type: 'AI_RESPONSE_READY',
        response: response.spokenText,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      await this.handleEvent({
        type: 'ERROR',
        error: error as Error,
      });
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Speak AI response
   */
  private async speakResponse(responseText: string): Promise<void> {
    this.setState({ type: 'speaking', response: responseText });

    try {
      await this.speechController.speak(responseText);

      // Check if interrupted during speaking
      if (this.state.type !== 'speaking') {
        return; // Interrupted, abort
      }

      await this.handleEvent({ type: 'SPEECH_COMPLETE' });
    } catch (error) {
      await this.handleEvent({
        type: 'ERROR',
        error: error as Error,
      });
    }
  }

  /**
   * Handle user interrupt
   */
  private handleInterrupt(): void {
    // Cancel any ongoing operations
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    // Stop speech immediately
    this.speechController.interrupt();

    // Transition to interrupted state (will auto-transition to idle)
    this.setState({ type: 'interrupted' });

    // Immediately transition to idle
    setTimeout(() => {
      if (this.state.type === 'interrupted') {
        this.returnToIdle();
      }
    }, 0);
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    // Stop everything
    this.speechController.interrupt();
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    this.setState({ type: 'error', error: error.message });
  }

  /**
   * Return to idle state
   */
  private returnToIdle(): void {
    this.setState({ type: 'idle' });
  }

  /**
   * Set state and notify listeners
   */
  private setState(newState: SpokenLoopState): void {
    this.state = newState;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): SpokenLoopState {
    return this.state;
  }

  /**
   * Check if transition is valid
   */
  private canTransition(event: SpokenLoopEvent): boolean {
    const { type: currentState } = this.state;
    const { type: eventType } = event;

    // USER_INTERRUPT always valid except from idle/error
    if (eventType === 'USER_INTERRUPT') {
      return currentState !== 'idle' && currentState !== 'error';
    }

    // ERROR always valid
    if (eventType === 'ERROR') {
      return true;
    }

    // State-specific validations
    const validTransitions: Record<string, string[]> = {
      'idle': ['START_LISTENING'],
      'listening': ['TRANSCRIPT_READY', 'USER_INTERRUPT', 'ERROR'],
      'thinking': ['AI_RESPONSE_READY', 'USER_INTERRUPT', 'ERROR'],
      'speaking': ['SPEECH_COMPLETE', 'USER_INTERRUPT', 'ERROR'],
      'interrupted': [], // auto-transitions
      'error': ['RESET'],
    };

    return validTransitions[currentState]?.includes(eventType) ?? false;
  }
}
