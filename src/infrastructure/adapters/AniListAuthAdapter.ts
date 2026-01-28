import open from "open";
import axios from "axios";
import readline from "readline";
import fs from "fs";
import path from "path";
import { IAuthService } from "../../domain";

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authCode?: string;
  envPath: string;
}

const AUTH_URL = "https://anilist.co/api/v2/oauth/authorize";
const TOKEN_URL = "https://anilist.co/api/v2/oauth/token";

/**
 * AniList Authentication Adapter
 * Implements IAuthService for AniList OAuth flow
 */
export class AniListAuthAdapter implements IAuthService {
  constructor(private readonly config: AuthConfig) {}

  async openAuthUrl(): Promise<string> {
    const authUrl = `${AUTH_URL}?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&response_type=code`;
    await open(authUrl);
    return authUrl;
  }

  async promptAndSaveAuthCode(): Promise<void> {
    const code = await this.promptUser("Enter the authorization code: ");
    this.updateEnvFile("ANILIST_AUTHTOKEN", code);
    console.log("Authentication code saved!");
  }

  async generateToken(): Promise<string | null> {
    try {
      const response = await axios.post(TOKEN_URL, {
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code: this.config.authCode,
      });

      if (response.status === 200) {
        console.log("Token generated successfully");
        return response.data.access_token;
      }

      return null;
    } catch (error) {
      console.error("Error generating token:", error);
      return null;
    }
  }

  async promptAndSaveJwtToken(): Promise<void> {
    const token = await this.promptUser("Enter the JWT token: ");
    this.updateEnvFile("ANILIST_JWT", token);
    console.log("JWT token saved!");
  }

  private promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        rl.close();
        if (!answer) {
          console.log("No input provided.");
          process.exit(1);
        }
        resolve(answer);
      });
    });
  }

  private updateEnvFile(key: string, value: string): void {
    let envContent = "";

    try {
      envContent = fs.readFileSync(this.config.envPath, "utf8");
    } catch {
      // File doesn't exist, will be created
    }

    const regex = new RegExp(`${key}=.*`);
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}\n`;
    }

    fs.writeFileSync(this.config.envPath, envContent, "utf8");
  }
}
