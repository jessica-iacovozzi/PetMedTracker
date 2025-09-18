import { chromium, FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  // Global teardown that runs once after all tests
  console.log("🧹 Starting E2E test teardown...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test data
    await page.goto("http://localhost:3000", { timeout: 30000 });

    // Clear notification logs
    try {
      await page.request.delete("/api/test/mock/notifications");
    } catch (error) {
      console.warn("⚠️ Failed to clear notification logs:", error);
    }

    // Reset database to clean state
    try {
      await page.request.post("/api/test/reset-db", {
        data: { clearAll: true },
      });
    } catch (error) {
      console.warn("⚠️ Failed to reset database:", error);
    }

    console.log("✅ Test cleanup completed");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
