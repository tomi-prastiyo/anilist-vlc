/**
 * Composition Root
 * Wires up all dependencies using dependency injection
 * This is the only place where concrete implementations are referenced
 */
import { logger } from "../infrastructure/logger";
import { serviceManager } from "./ServiceManager";

export async function bootstrap(): Promise<void> {
  try {
    await serviceManager.start();
  } catch (err) {
    logger.error("Failed to start ServiceManager:", err);
  }
}
