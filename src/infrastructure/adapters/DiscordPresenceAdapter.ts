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

  private isConnecting = false;
  private isConnected = false;
  private lastError?: string;

  async connect(): Promise<void> {
    this.client.on("ready", () => {
      this.isConnected = true;
      this.isConnecting = false;
      logger.info(`Discord RPC connected as ${this.client.user?.username}`);
      this.readyCallback?.();
    });

    this.client.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("Discord RPC disconnected.");
    });

    await this.tryConnect();
  }

  private async tryConnect() {
    if (this.isConnecting || this.isConnected) return;
    this.isConnecting = true;

    try {
      this.lastError = undefined;
      await this.client.login();
      this.isConnected = true;
      this.isConnecting = false;
      logger.info(`Discord RPC login resolved. User: ${this.client.user?.username || 'unknown'}`);
    } catch (error: any) {
      this.isConnecting = false;
      this.lastError = error.message;
      logger.warn("Could not connect to Discord RPC (is Discord running?): " + error.message);
      // We don't throw here so it doesn't crash. We'll retry in setActivity if needed.
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      try {
        await this.client.destroy();
      } catch (err) {
        logger.error("Error disconnecting Discord client:", err);
      }
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  async setActivity(activity: DiscordActivity): Promise<void> {
    if (!this.isConnected) {
      await this.tryConnect();
      if (!this.isConnected) return;
    }
    try {
      await this.client.user?.setActivity(activity);
    } catch (error: any) {
      this.lastError = error.message;
      logger.error(`Failed to set Discord activity: ${error.message}`);
    }
  }

  async clearActivity(): Promise<void> {
    if (!this.isConnected) return;
    await this.client.user?.clearActivity();
  }

  onReady(callback: () => void): void {
    this.readyCallback = callback;
  }

  getUsername(): string | undefined {
    return this.client.user?.username;
  }

  getLastError(): string | undefined {
    return this.lastError;
  }
}
