import { IAuthService } from "../../domain";

/**
 * Use Case: Authenticate User
 * Handles the OAuth authentication flow
 */
export class AuthenticateUserUseCase {
  constructor(private readonly authService: IAuthService) {}

  /**
   * Run the full authentication flow if tokens are missing
   */
  async execute(hasAuthCode: boolean, hasJwtToken: boolean): Promise<void> {
    if (!hasAuthCode) {
      await this.authService.openAuthUrl();
      await this.authService.promptAndSaveAuthCode();
    }

    if (!hasJwtToken) {
      await this.authService.generateToken();
      await this.authService.promptAndSaveJwtToken();
    }
  }
}
