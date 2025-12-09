import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';

/**
 * Interface for resources that need to be closed after tests
 */
export interface TestResources {
  app?: INestApplication;
  dataSource?: DataSource;
  redisClient?: Redis;
  moduleRef?: any;
}

/**
 * Class for managing test resources
 */
export class TestResourceManager {
  private resources: TestResources = {};
  private cleanupFunctions: Array<() => Promise<void>> = [];

  /**
   * Registers a resource for subsequent cleanup
   */
  register<T extends keyof TestResources>(key: T, resource: TestResources[T]): void {
    this.resources[key] = resource;
  }

  /**
   * Adds a cleanup function
   */
  addCleanup(cleanup: () => Promise<void>): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Performs cleanup of all resources
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];

    // Execute custom cleanup functions
    for (const cleanup of this.cleanupFunctions.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error as Error);
        console.warn('Error during custom cleanup:', error);
      }
    }

    // Close standard resources
    try {
      if (this.resources.redisClient && this.resources.redisClient.status !== 'end') {
        await this.resources.redisClient.quit();
      }
    } catch (error) {
      errors.push(error as Error);
      console.warn('Error closing Redis:', error);
    }

    try {
      if (this.resources.dataSource?.isInitialized) {
        await this.resources.dataSource.destroy();
      }
    } catch (error) {
      errors.push(error as Error);
      console.warn('Error closing DataSource:', error);
    }

    try {
      if (this.resources.app) {
        await this.resources.app.close();
      }
    } catch (error) {
      errors.push(error as Error);
      console.warn('Error closing app:', error);
    }

    try {
      if (this.resources.moduleRef) {
        await this.resources.moduleRef.close();
      }
    } catch (error) {
      errors.push(error as Error);
      console.warn('Error closing moduleRef:', error);
    }

    // Clear references
    this.resources = {};
    this.cleanupFunctions = [];

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // If there were errors, log them
    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors`);
    }
  }

  /**
   * Gets a registered resource
   */
  get<T extends keyof TestResources>(key: T): TestResources[T] {
    return this.resources[key];
  }
}

/**
 * Utility for creating a timeout with promise
 */
export function createTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility for waiting for resource close with timeout
 */
export async function waitForResourceClose(
  checkFn: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (checkFn()) {
      return true;
    }
    await createTimeout(intervalMs);
  }

  return false;
}

/**
 * Setup test environment
 * Creates necessary directories and files for tests
 */
export async function setupTestEnvironment(): Promise<void> {
  // Nothing to do for now
}

/**
 * Cleanup test environment
 * Removes temporary files created for tests
 */
export async function cleanupTestEnvironment(): Promise<void> {
  // Nothing to do for now
}
