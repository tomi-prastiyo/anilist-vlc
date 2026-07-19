import { logger } from "../logger";

/**
 * Rate Limit Manager for AniList API
 * Handles rate limiting (90 requests/minute), burst limiting, and retry logic
 */
export class RateLimitManager {
  private requestLimit: number = 90; // Default: 90 requests per minute
  private remainingRequests: number = 90;
  private resetTime: number = Date.now() + 60000; // Reset every 60 seconds
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // Minimum 100ms between requests (burst protection)
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  /**
   * Check if we have room to make a request
   * If we're out of requests, wait until reset or throw error
   */
  async waitForAvailableSlot(): Promise<void> {
    const now = Date.now();

    // Reset limit if window has passed
    if (now >= this.resetTime) {
      this.resetTime = now + 60000;
      this.remainingRequests = this.requestLimit;
    }

    // If we have requests available, check burst limit
    if (this.remainingRequests > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.sleep(this.minRequestInterval - timeSinceLastRequest);
      }
      return;
    }

    // Out of requests, need to wait for reset
    const waitTime = this.resetTime - now;
    logger.warn(
      `[RateLimit] Out of requests. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`,
    );
    await this.sleep(waitTime + 100);
  }

  /**
   * Update rate limit info from response headers
   */
  updateFromHeaders(headers: Headers): void {
    const limitHeader = headers.get("X-RateLimit-Limit");
    const remainingHeader = headers.get("X-RateLimit-Remaining");
    const resetHeader = headers.get("X-RateLimit-Reset");

    if (limitHeader) {
      this.requestLimit = parseInt(limitHeader, 10);
    }

    if (remainingHeader) {
      this.remainingRequests = parseInt(remainingHeader, 10);
    }

    if (resetHeader) {
      const resetTimestamp = parseInt(resetHeader, 10);
      this.resetTime = resetTimestamp * 1000; // Convert to milliseconds
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Handle 429 Too Many Requests response
   * Parse Retry-After header and wait accordingly
   */
  async handleRateLimitError(headers: Headers): Promise<void> {
    const retryAfter = headers.get("Retry-After");
    const resetHeader = headers.get("X-RateLimit-Reset");

    let waitSeconds = 60; // Default 60 seconds

    if (retryAfter) {
      // Retry-After can be in seconds or HTTP date format
      const retryAfterValue = parseInt(retryAfter, 10);
      if (!isNaN(retryAfterValue)) {
        waitSeconds = retryAfterValue;
      }
    } else if (resetHeader) {
      const resetTimestamp = parseInt(resetHeader, 10);
      waitSeconds = Math.max(1, resetTimestamp - Math.floor(Date.now() / 1000));
    }

    this.remainingRequests = 0;
    this.resetTime = Date.now() + waitSeconds * 1000;

    logger.warn(
      `[RateLimit] Rate limit exceeded. Waiting ${waitSeconds}s before retrying...`,
    );
    await this.sleep(waitSeconds * 1000);
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    remainingRequests: number;
    requestLimit: number;
    resetTime: number;
    canMakeRequest: boolean;
  } {
    const now = Date.now();
    const canMakeRequest = this.remainingRequests > 0 && now < this.resetTime;

    return {
      remainingRequests: this.remainingRequests,
      requestLimit: this.requestLimit,
      resetTime: this.resetTime,
      canMakeRequest,
    };
  }

  /**
   * Queue a request to be processed sequentially
   * This prevents burst limiting
   */
  async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await this.waitForAvailableSlot();
        try {
          await request();
        } catch (error) {
          logger.error("[RateLimit] Error processing queued request:", error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
