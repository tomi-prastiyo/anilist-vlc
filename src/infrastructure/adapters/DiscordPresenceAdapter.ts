import { Client } from "@xhayper/discord-rpc";
import { IPresenceService, DiscordActivity } from "../../domain";
import { logger } from "../logger";

/**
 * Discord Rich Presence Adapter
 * Implements IPresenceService for Discord RPC
 */
export class DiscordPresenceAdapter implements IPresenceService {
  private readonly client: Client;
  private readyCallback?: () => void;

  constructor(clientId: string) {
    this.client = new Client({ clientId });
  }

  async connect(): Promise<void> {
    this.client.on("ready", () => {
      logger.info(`Discord RPC connected as ${this.client.user?.username}`);
      this.readyCallback?.();
    });

    try {
      await this.client.login();
    } catch (error: any) {
      logger.warn("Could not connect to Discord RPC (is Discord running?): " + error.message);
      throw error;
    }
  }

  async setActivity(activity: DiscordActivity): Promise<void> {
    await this.client.user?.setActivity(activity);
  }

  async clearActivity(): Promise<void> {
    await this.client.user?.clearActivity();
  }

  onReady(callback: () => void): void {
    this.readyCallback = callback;
  }

  getUsername(): string | undefined {
    return this.client.user?.username;
  }
}
