import { Client } from "@xhayper/discord-rpc";
import { IPresenceService, DiscordActivity } from "../../domain";

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
      console.log("Discord RPC connected as", this.client.user?.username);
      this.readyCallback?.();
    });

    await this.client.login();
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
