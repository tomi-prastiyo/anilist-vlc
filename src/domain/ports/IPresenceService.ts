import { DiscordActivity } from "../entities";

/**
 * Port: IPresenceService
 * Defines the contract for rich presence integrations
 * This abstraction allows swapping Discord with other presence providers
 */
export interface IPresenceService {
  /**
   * Initialize and connect to the presence service
   */
  connect(): Promise<void>;

  /**
   * Update the current activity/presence
   */
  setActivity(activity: DiscordActivity): Promise<void>;

  /**
   * Clear the current activity
   */
  clearActivity(): Promise<void>;

  /**
   * Register a callback for when the service is ready
   */
  onReady(callback: () => void): void;

  /**
   * Get the connected username
   */
  getUsername(): string | undefined;
}
