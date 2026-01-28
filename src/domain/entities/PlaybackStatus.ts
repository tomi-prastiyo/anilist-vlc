/**
 * Domain Entity: PlaybackStatus
 * Represents the current state of media playback
 */
export interface PlaybackStatus {
  title: string;
  length: number;
  time: number;
  state: PlaybackState;
}

export type PlaybackState = "playing" | "paused" | "stopped";

export interface ParsedTitle {
  title: string;
  episode: string;
}
