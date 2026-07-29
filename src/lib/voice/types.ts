/**
 * Type definitions for the Voice Spine (Phase 0)
 */

export type SpokenLoopState =
  | { type: 'idle' }
  | { type: 'listening' }
  | { type: 'thinking'; transcript: string }
  | { type: 'speaking'; response: string }
  | { type: 'interrupted' }
  | { type: 'error'; error: string };

export type SpokenLoopEvent =
  | { type: 'START_LISTENING' }
  | { type: 'TRANSCRIPT_READY'; transcript: string }
  | { type: 'AI_RESPONSE_READY'; response: string }
  | { type: 'SPEECH_COMPLETE' }
  | { type: 'USER_INTERRUPT' }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };
