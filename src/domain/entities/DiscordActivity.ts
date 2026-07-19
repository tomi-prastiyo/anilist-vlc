/**
 * Domain Entity: DiscordActivity
 * Represents Discord Rich Presence activity payload
 */
export interface DiscordActivity {
  details: string;
  detailsUrl?: string;
  state: string;
  instance: boolean;
  largeImageKey: string;
  largeImageUrl?: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageUrl?: string;
  smallImageText: string;
  type?: number;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: Array<{ label: string; url: string }>;
}
