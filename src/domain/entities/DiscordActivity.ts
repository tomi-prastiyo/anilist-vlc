/**
 * Domain Entity: DiscordActivity
 * Represents Discord Rich Presence activity payload
 */
export interface DiscordActivity {
  details: string;
  state: string;
  instance: boolean;
  largeImageKey: string;
  largeImageText: string;
  type: number;
  startTimestamp?: number;
  endTimestamp?: number;
}
