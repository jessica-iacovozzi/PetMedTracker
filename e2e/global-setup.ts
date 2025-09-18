import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // Global setup that runs once before all tests
  console.log("🚀 Starting E2E test setup...");

  // In CI environment, wait for the dev server to be ready
  if (process.env.CI) {
    console.log("⏳ Waiting for dev server in CI environment...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
  }

  // Start the development server if not already running
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready with retries
    let retries = 5;
    let appReady = false;

    while (retries > 0 && !appReady) {
      try {
        await page.goto("http://localhost:3000", {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        appReady = true;
        console.log("✅ Application is ready for testing");
      } catch (error) {
        retries--;
        console.log(
          `⏳ Waiting for app to be ready... (${retries} retries left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (!appReady) {
      throw new Error("Application failed to start after multiple retries");
    }

    // Initialize test database
    const response = await page.request.post("/api/test/reset-db");
    if (response.ok()) {
      console.log("✅ Test database initialized");
    } else {
      console.error("❌ Failed to initialize test database");
      const responseText = await response.text();
      console.error("Response:", responseText);
    }
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
