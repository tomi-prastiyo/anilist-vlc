import { IAuthService } from "../../domain";
import { logger } from "../../infrastructure/logger";

/**
 * Use Case: Authenticate User
 * Handles the OAuth authentication flow
 */
export class AuthenticateUserUseCase {
  constructor(private readonly authService: IAuthService) {}

  /**
   * Run the full authentication flow if tokens are missing.
   * Returns true if new authentication was performed (app should restart).
   */
  async execute(hasAuthCode: boolean, hasJwtToken: boolean): Promise<boolean> {
    let authenticated = false;

    if (!hasAuthCode) {
      await this.authService.openAuthUrl();
      await this.authService.promptAndSaveAuthCode();
      authenticated = true;
    }

    if (!hasJwtToken) {
      const token = await this.authService.generateToken();
      if (!token) {
        logger.error(
          "Failed to generate access token. Please check your auth code and try again.",
        );
        process.exit(1);
      }
      authenticated = true;
    }

    return authenticated;
  }
}
