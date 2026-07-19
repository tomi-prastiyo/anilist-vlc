import { RateLimitManager } from "./RateLimitManager";

/**
 * Rate Limit Status Service
 * Provides rate limit information to the application
 * Useful for UI components and monitoring
 */
export class RateLimitStatusService {
  private static instance: RateLimitStatusService;
  private rateLimitManagers: Map<string, RateLimitManager> = new Map();
  private listeners: Array<(status: RateLimitStatus) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimitStatusService {
    if (!RateLimitStatusService.instance) {
      RateLimitStatusService.instance = new RateLimitStatusService();
    }
    return RateLimitStatusService.instance;
  }

  /**
   * Register a rate limit manager for monitoring
   */
  registerManager(name: string, manager: RateLimitManager): void {
    this.rateLimitManagers.set(name, manager);
  }

  /**
   * Get rate limit status for a specific manager
   */
  getStatus(name: string = "default"): RateLimitStatus | null {
    const manager = this.rateLimitManagers.get(name);
    if (!manager) return null;

    const status = manager.getStatus();
    return {
      name,
      remainingRequests: status.remainingRequests,
      requestLimit: status.requestLimit,
      resetTime: status.resetTime,
      canMakeRequest: status.canMakeRequest,
      percentageRemaining:
        (status.remainingRequests / status.requestLimit) * 100,
      secondsUntilReset: Math.max(
        0,
        Math.ceil((status.resetTime - Date.now()) / 1000),
      ),
      isWarning: status.remainingRequests < status.requestLimit * 0.2, // Less than 20%
      isCritical: status.remainingRequests < status.requestLimit * 0.1, // Less than 10%
    };
  }

  /**
   * Get all rate limit statuses
   */
  getAllStatuses(): RateLimitStatus[] {
    const statuses: RateLimitStatus[] = [];
    for (const [name] of this.rateLimitManagers) {
      const status = this.getStatus(name);
      if (status) statuses.push(status);
    }
    return statuses;
  }

  /**
   * Subscribe to rate limit changes
   */
  subscribe(listener: (status: RateLimitStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of rate limit change
   */
  private notifyListeners(status: RateLimitStatus): void {
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  /**
   * Start monitoring rate limit changes (call periodically)
   */
  startMonitoring(interval: number = 5000): NodeJS.Timer {
    return setInterval(() => {
      for (const status of this.getAllStatuses()) {
        this.notifyListeners(status);
      }
    }, interval);
  }

  /**
   * Get formatted status message
   */
  getStatusMessage(name: string = "default"): string {
    const status = this.getStatus(name);
    if (!status) return "Rate limiter not found";

    if (status.isCritical) {
      return `⚠️ CRITICAL: ${status.remainingRequests}/${status.requestLimit} requests remaining. Retry in ${status.secondsUntilReset}s`;
    }

    if (status.isWarning) {
      return `⚠️ WARNING: Only ${status.remainingRequests}/${status.requestLimit} requests remaining`;
    }

    return `✓ OK: ${status.remainingRequests}/${status.requestLimit} requests available`;
  }

  /**
   * Check if rate limiting is active (has used at least one request)
   */
  isActive(name: string = "default"): boolean {
    const status = this.getStatus(name);
    return status ? status.remainingRequests < status.requestLimit : false;
  }

  /**
   * Clear all registered managers
   */
  clear(): void {
    this.rateLimitManagers.clear();
  }
}

/**
 * Rate Limit Status interface
 */
export interface RateLimitStatus {
  name: string;
  remainingRequests: number;
  requestLimit: number;
  resetTime: number;
  canMakeRequest: boolean;
  percentageRemaining: number;
  secondsUntilReset: number;
  isWarning: boolean;
  isCritical: boolean;
}
