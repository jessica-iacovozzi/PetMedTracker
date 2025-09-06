import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // Global setup that runs once before all tests
  console.log("🚀 Starting E2E test setup...");

  // Start the development server if not already running
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("✅ Application is ready for testing");

    // Initialize test database
    const response = await page.request.post("/api/test/reset-db");
    if (response.ok()) {
      console.log("✅ Test database initialized");
    } else {
      console.error("❌ Failed to initialize test database");
    }
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
