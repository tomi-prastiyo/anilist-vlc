/**
 * Port: IAuthService
 * Defines the contract for authentication operations
 */
export interface IAuthService {
  /**
   * Open the authorization URL in the browser
   */
  openAuthUrl(): Promise<string>;

  /**
   * Prompt user for auth code and save it
   */
  promptAndSaveAuthCode(): Promise<void>;

  /**
   * Generate access token from auth code
   */
  generateToken(): Promise<string | null>;

  /**
   * Prompt user for JWT token and save it
   */
  promptAndSaveJwtToken(): Promise<void>;
}
