import { chromium, FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  // Global teardown that runs once after all tests
  console.log("🧹 Starting E2E test teardown...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test data
    await page.goto("http://localhost:3000");

    // Clear notification logs
    await page.request.delete("/api/test/mock/notifications");

    // Reset database to clean state
    await page.request.post("/api/test/reset-db", {
      data: { clearAll: true },
    });

    console.log("✅ Test cleanup completed");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
