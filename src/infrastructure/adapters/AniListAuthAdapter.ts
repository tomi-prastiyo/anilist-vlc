import open from "open";
import axios from "axios";
import readline from "readline";
import { IAuthService } from "../../domain";
import { configStore } from "../config/ConfigStore";

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authCode: string;
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
    this.config.authCode = code;
    
    // Save to ConfigStore
    configStore.updateConfig({ anilist: { authCode: code } });
    console.log("Authentication code saved to config!");
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
        const accessToken = response.data.access_token;
        
        // Save to ConfigStore
        configStore.updateConfig({ anilist: { accessToken: accessToken } });
        console.log("Token generated and saved successfully to config.");
        return accessToken;
      }

      return null;
    } catch (error) {
      console.error("Error generating token:", error);
      return null;
    }
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
}
