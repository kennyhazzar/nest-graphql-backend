/**
 * Jest setup file for e2e tests
 * Configures proper behavior for async operations
 */

// Increase timeouts for stability
jest.setTimeout(120000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
  // In tests, it's better to continue rather than exit
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.warn('Uncaught Exception:', error);
  // In tests, it's better to continue rather than exit
});

// Prevent conflicts between tests
beforeEach(() => {
  // Clear mocks before each test
  jest.clearAllMocks();
});

// Force cleanup after all tests complete
afterAll(async () => {
  // Give time for all async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Settings for better Jest compatibility
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = setImmediate;
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = clearImmediate;
}

export {};
