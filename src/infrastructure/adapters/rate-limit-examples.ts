/**
 * Rate Limiting Usage Examples
 * Demonstrates how to use the rate limiting implementation
 */

import {
  AniListRepository,
  RateLimitStatusService,
  RateLimitManager,
} from "@infrastructure/adapters";

// ============================================================================
// EXAMPLE 1: Basic Usage (Automatic)
// ============================================================================

async function example1_basicUsage() {
  console.log("=== Example 1: Basic Usage ===");

  const repository = new AniListRepository("your-access-token");

  try {
    // All API calls automatically handle rate limiting
    const searchResults = await repository.searchMedia("Naruto");
    console.log("Search results:", searchResults);

    // This will respect rate limits transparently
    const media = await repository.getMediaCover(searchResults[0].id);
    console.log("Media cover:", media);
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================================================
// EXAMPLE 2: Monitoring Rate Limit Status
// ============================================================================

async function example2_monitoringStatus() {
  console.log("=== Example 2: Monitoring Rate Limit Status ===");

  const statusService = RateLimitStatusService.getInstance();

  // Check current status
  const status = statusService.getStatus("anilist");
  if (status) {
    console.log(
      `Remaining: ${status.remainingRequests}/${status.requestLimit}`,
    );
    console.log(`Percentage: ${status.percentageRemaining.toFixed(1)}%`);
    console.log(`Resets in: ${status.secondsUntilReset}s`);
    console.log(`Can make request: ${status.canMakeRequest}`);

    // Get formatted message
    console.log(statusService.getStatusMessage("anilist"));
  }
}

// ============================================================================
// EXAMPLE 3: Subscribing to Rate Limit Changes
// ============================================================================

async function example3_subscribeToChanges() {
  console.log("=== Example 3: Subscribe to Rate Limit Changes ===");

  const statusService = RateLimitStatusService.getInstance();

  // Subscribe to rate limit changes
  const unsubscribe = statusService.subscribe((status) => {
    console.log(
      `[Rate Limit Update] ${status.name}: ${status.remainingRequests}/${status.requestLimit}`,
    );

    if (status.isCritical) {
      console.warn("🚨 CRITICAL: Rate limit nearly exhausted!");
    } else if (status.isWarning) {
      console.warn("⚠️ WARNING: Rate limit running low");
    }
  });

  // Start monitoring (checks every 5 seconds)
  const monitoringInterval = statusService.startMonitoring(5000);

  // Make some requests...
  const repository = new AniListRepository("your-access-token");
  for (let i = 0; i < 5; i++) {
    try {
      await repository.searchMedia(`anime-${i}`);
    } catch (error) {
      console.error(`Request ${i} failed`);
    }
  }

  // Cleanup
  clearInterval(monitoringInterval);
  unsubscribe();
}

// ============================================================================
// EXAMPLE 4: Pre-Check Before Making Requests
// ============================================================================

async function example4_preCheckBeforeRequest() {
  console.log("=== Example 4: Pre-Check Before Making Requests ===");

  const statusService = RateLimitStatusService.getInstance();
  const repository = new AniListRepository("your-access-token");

  async function makeRequestSafely(title: string) {
    const status = statusService.getStatus("anilist");

    if (!status) {
      console.log("Status service not available");
      return null;
    }

    if (!status.canMakeRequest) {
      console.log(
        `Cannot make request. Please wait ${status.secondsUntilReset}s`,
      );
      return null;
    }

    if (status.isCritical) {
      console.log("Rate limit critical. Deferring request...");
      // Implement exponential backoff or queue logic
      return null;
    }

    try {
      return await repository.searchMedia(title);
    } catch (error) {
      console.error("Request failed:", error);
      return null;
    }
  }

  // Safe request
  const result = await makeRequestSafely("Naruto");
  console.log("Result:", result);
}

// ============================================================================
// EXAMPLE 5: Batch Operations with Rate Limit Awareness
// ============================================================================

async function example5_batchOperations() {
  console.log("=== Example 5: Batch Operations ===");

  const statusService = RateLimitStatusService.getInstance();
  const repository = new AniListRepository("your-access-token");

  const titles = [
    "Naruto",
    "One Piece",
    "Bleach",
    "Death Note",
    "Attack on Titan",
  ];

  async function batchSearch(titles: string[]) {
    const results = [];

    for (const title of titles) {
      const status = statusService.getStatus("anilist");

      if (status && status.isCritical) {
        console.log("Rate limit critical. Stopping batch...");
        break;
      }

      try {
        const result = await repository.searchMedia(title);
        results.push({ title, success: true, data: result });
        console.log(`✓ Searched for: ${title}`);
      } catch (error) {
        results.push({
          title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`✗ Failed to search for: ${title}`);
      }
    }

    return results;
  }

  const results = await batchSearch(titles);
  console.log("Batch results:", results);
}

// ============================================================================
// EXAMPLE 6: Custom Rate Limit Manager
// ============================================================================

async function example6_customManager() {
  console.log("=== Example 6: Custom Rate Limit Manager ===");

  const customManager = new RateLimitManager();

  // Queue custom API calls
  async function makeCustomRequest<T>(
    fetcher: () => Promise<Response>,
  ): Promise<T> {
    return customManager.queueRequest(async () => {
      await customManager.waitForAvailableSlot();

      const response = await fetcher();
      customManager.updateFromHeaders(response.headers);

      if (response.status === 429) {
        await customManager.handleRateLimitError(response.headers);
        throw new Error("Rate limited");
      }

      return response.json() as T;
    });
  }

  // Use it
  try {
    const result = await makeCustomRequest(() =>
      fetch("https://graphql.anilist.co", {
        method: "POST",
        body: JSON.stringify({ query: "..." }),
      }),
    );
    console.log("Custom request result:", result);
  } catch (error) {
    console.error("Custom request failed:", error);
  }
}

// ============================================================================
// EXAMPLE 7: Error Handling and Retry Logic
// ============================================================================

async function example7_errorHandling() {
  console.log("=== Example 7: Error Handling ===");

  const repository = new AniListRepository("your-access-token");

  async function requestWithErrorHandling(title: string, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Searching for "${title}"`);
        return await repository.searchMedia(title);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Too Many Requests")) {
          console.log(`Rate limited. Retrying in 30s...`);
          await new Promise((resolve) => setTimeout(resolve, 30000));
          continue;
        }

        if (errorMessage.includes("Max retries exceeded")) {
          console.error("Max retries exceeded. Giving up.");
          throw error;
        }

        console.error(`Error: ${errorMessage}`);
        throw error;
      }
    }
  }

  try {
    const result = await requestWithErrorHandling("Naruto");
    console.log("Success:", result);
  } catch (error) {
    console.error("All attempts failed:", error);
  }
}

// ============================================================================
// EXAMPLE 8: UI Integration - Display Rate Limit Status
// ============================================================================

async function example8_uiIntegration() {
  console.log("=== Example 8: UI Integration ===");

  const statusService = RateLimitStatusService.getInstance();

  // Function to display status in UI
  function updateUIStatus() {
    const status = statusService.getStatus("anilist");
    if (!status) return;

    const statusElement = document.createElement("div");
    statusElement.className = `rate-limit-status ${
      status.isCritical ? "critical" : status.isWarning ? "warning" : "ok"
    }`;

    statusElement.innerHTML = `
      <div class="rate-limit-bar">
        <div class="rate-limit-fill" style="width: ${status.percentageRemaining}%"></div>
      </div>
      <p>${statusService.getStatusMessage("anilist")}</p>
      <small>Resets in ${status.secondsUntilReset}s</small>
    `;

    return statusElement;
  }

  // Start continuous monitoring
  const statusService2 = RateLimitStatusService.getInstance();
  statusService2.startMonitoring(5000);

  console.log("Rate limit status display created");
  console.log(updateUIStatus());
}

// ============================================================================
// Run Examples
// ============================================================================

export const examples = {
  example1_basicUsage,
  example2_monitoringStatus,
  example3_subscribeToChanges,
  example4_preCheckBeforeRequest,
  example5_batchOperations,
  example6_customManager,
  example7_errorHandling,
  example8_uiIntegration,
};

// To run an example:
// import { examples } from './rate-limit-examples';
// await examples.example1_basicUsage();
