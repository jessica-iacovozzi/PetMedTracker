import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database before each test
    await page.request.post("/api/test/reset-db");
  });

  test("should complete full onboarding flow", async ({ page }) => {
    // Start onboarding
    await page.goto("/onboarding");

    // Step 1: Welcome screen
    await expect(page.locator("h2")).toContainText("Welcome to PetMeds!");
    await page.click('button:has-text("Get Started")');

    // Step 2: Add pet
    await expect(page.locator("h3")).toContainText("Tell us about your pet");
    await page.fill(
      '[data-testid="pet-name"], input[placeholder*="Buddy"]',
      "Test Dog",
    );
    await page.selectOption('[data-testid="pet-species"], select', "dog");
    await page.click('button:has-text("Continue")');

    // Step 3: Add medication
    await expect(page.locator("h3")).toContainText(
      "Add Test Dog's First Medication",
    );
    await page.fill(
      '[data-testid="medication-name"], input[placeholder*="Heartgard"]',
      "Test Medicine",
    );
    await page.fill(
      '[data-testid="medication-dosage"], input[placeholder*="tablet"]',
      "1 tablet",
    );
    await page.selectOption(
      '[data-testid="medication-frequency"], select',
      "daily",
    );
    await page.fill(
      '[data-testid="medication-timing"], input[type="time"]',
      "09:00",
    );
    await page.click('button:has-text("Continue")');

    // Step 4: Notification preferences
    await expect(page.locator("h3")).toContainText("Set Up Notifications");
    // Email notifications should be enabled by default
    await expect(
      page.locator('[data-testid="email-notifications"], #email-notifications'),
    ).toBeChecked();
    // Push notifications should be enabled by default
    await expect(
      page.locator('[data-testid="push-notifications"], #push-notifications'),
    ).toBeChecked();
    await page.click('button:has-text("Continue")');

    // Step 5: Completion
    await expect(page.locator("h3")).toContainText("All Set!");
    await expect(page.locator("text=Added Test Dog")).toBeVisible();
    await expect(
      page.locator("text=Set up Test Medicine medication"),
    ).toBeVisible();
    await page.click('button:has-text("Go to Dashboard")');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator("text=Test Dog")).toBeVisible();
  });

  test("should allow skipping medication setup", async ({ page }) => {
    await page.goto("/onboarding");

    // Welcome
    await page.click('button:has-text("Get Started")');

    // Add pet
    await page.fill('input[placeholder*="Buddy"]', "Skip Test Dog");
    await page.selectOption("select", "cat");
    await page.click('button:has-text("Continue")');

    // Skip medication
    await page.click('button:has-text("Skip for now")');

    // Skip notifications
    await page.click('button:has-text("Skip for now")');

    // Completion
    await expect(page.locator("h3")).toContainText("All Set!");
    await expect(page.locator("text=Added Skip Test Dog")).toBeVisible();
    await page.click('button:has-text("Go to Dashboard")');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/onboarding");

    // Welcome
    await page.click('button:has-text("Get Started")');

    // Try to continue without filling pet name
    await page.click('button:has-text("Continue")');
    await expect(
      page.locator("text=Please fill in all required fields"),
    ).toBeVisible();

    // Fill pet name but not species
    await page.fill('input[placeholder*="Buddy"]', "Test Pet");
    await page.click('button:has-text("Continue")');
    await expect(
      page.locator("text=Please fill in all required fields"),
    ).toBeVisible();

    // Fill both required fields
    await page.selectOption("select", "dog");
    await page.click('button:has-text("Continue")');

    // Should proceed to next step
    await expect(page.locator("h3")).toContainText(
      "Add Test Pet's First Medication",
    );
  });

  test("should handle onboarding errors gracefully", async ({ page }) => {
    await page.goto("/onboarding");

    // Complete first steps
    await page.click('button:has-text("Get Started")');
    await page.fill('input[placeholder*="Buddy"]', "Error Test Dog");
    await page.selectOption("select", "dog");
    await page.click('button:has-text("Continue")');

    // Fill medication form
    await page.fill('input[placeholder*="Heartgard"]', "Error Medicine");
    await page.fill('input[placeholder*="tablet"]', "1 tablet");
    await page.selectOption("select", "daily");
    await page.fill('input[type="time"]', "09:00");
    await page.click('button:has-text("Continue")');

    // Continue through notifications
    await page.click('button:has-text("Continue")');

    // If there's an error during completion, it should show error state
    // The completion component should handle errors and show retry option
    await page.waitForSelector(
      'h3:has-text("All Set!"), h3:has-text("Something went wrong")',
      { timeout: 10000 },
    );
  });
});
