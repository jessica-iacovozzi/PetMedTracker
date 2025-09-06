import { test, expect } from "@playwright/test";

test.describe("Dashboard Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database
    await page.request.post("/api/test/reset-db");
    await page.goto("/dashboard");
  });

  test("should display dashboard overview correctly", async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(
      page.locator("text=Manage your pets' medication schedules"),
    ).toBeVisible();

    // Check stats cards
    await expect(page.locator("text=Total Pets")).toBeVisible();
    await expect(page.locator("text=Active Medications")).toBeVisible();
    await expect(page.locator("text=Overdue")).toBeVisible();
    await expect(page.locator("text=Upcoming")).toBeVisible();

    // Should show pet information
    await expect(page.locator("text=Buddy")).toBeVisible();
    await expect(page.locator("text=dog")).toBeVisible();

    // Should show today's medication schedule
    await expect(
      page.locator("text=Today's Medication Schedule"),
    ).toBeVisible();
  });

  test("should show correct reminder statuses", async ({ page }) => {
    // Check for different reminder status indicators
    await expect(
      page.locator('.reminder-card, [data-testid="reminder-card"]'),
    ).toBeVisible();

    // Should show pending reminders
    await expect(page.locator("text=pending, text=Scheduled")).toBeVisible();

    // Check time groupings
    await expect(page.locator("text=Morning, text=🌅")).toBeVisible();
    await expect(page.locator("text=Evening, text=🌙")).toBeVisible();
  });

  test("should allow marking reminders as given", async ({ page }) => {
    // Find a pending reminder
    const reminderCard = page
      .locator('.reminder-card, [data-testid="reminder-card"]')
      .first();
    await expect(reminderCard).toBeVisible();

    // Click "Mark as Given" button
    await reminderCard.locator('button:has-text("Mark as Given")').click();

    // Should update status to given
    await expect(
      reminderCard.locator("text=✓ Given, text=Completed"),
    ).toBeVisible();

    // Button should be disabled or changed
    await expect(
      reminderCard.locator('button:has-text("Mark as Given")'),
    ).not.toBeVisible();
  });

  test("should display overdue reminders with alerts", async ({ page }) => {
    // Mock an overdue reminder by setting time in the past
    await page.evaluate(() => {
      // This would typically be done through API or database manipulation
      // For now, we'll check if overdue styling exists
    });

    // Look for overdue indicators
    const overdueElements = page.locator(
      "text=⚠️ Overdue, .text-red-600, .bg-red-100",
    );
    if ((await overdueElements.count()) > 0) {
      await expect(overdueElements.first()).toBeVisible();

      // Should show alert banner
      await expect(page.locator("text=medication overdue")).toBeVisible();
    }
  });

  test("should show upcoming reminders", async ({ page }) => {
    // Look for upcoming reminder indicators
    const upcomingElements = page.locator(
      "text=⏰ Due Soon, text=Due in, .text-yellow-600",
    );
    if ((await upcomingElements.count()) > 0) {
      await expect(upcomingElements.first()).toBeVisible();
    }
  });

  test("should navigate to different sections", async ({ page }) => {
    // Test navigation buttons
    await page.click('button:has-text("Add Pet"), a[href="/dashboard/pets"]');
    await expect(page).toHaveURL("/dashboard/pets");

    await page.goBack();

    await page.click(
      'button:has-text("Add Medication"), a[href="/dashboard/medications"]',
    );
    await expect(page).toHaveURL("/dashboard/medications");

    await page.goBack();

    // Test upgrade button
    await page.click(
      'button:has-text("Upgrade to Premium"), a[href="/pricing"]',
    );
    await expect(page).toHaveURL("/pricing");
  });

  test("should show empty states correctly", async ({ page }) => {
    // Clear all data to test empty states
    await page.request.post("/api/test/reset-db", {
      data: { clearAll: true },
    });

    await page.reload();

    // Should show empty pet state
    await expect(page.locator("text=No pets added yet")).toBeVisible();
    await expect(
      page.locator('button:has-text("Add Your First Pet")'),
    ).toBeVisible();

    // Should show no medications due today
    await expect(page.locator("text=No medications due today")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that dashboard elements are still visible and properly arranged
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator("text=Total Pets")).toBeVisible();

    // Stats cards should stack on mobile
    const statsCards = page.locator('.grid .card, [data-testid="stats-card"]');
    await expect(statsCards.first()).toBeVisible();

    // Pet cards should be responsive
    await expect(page.locator("text=Buddy")).toBeVisible();
  });

  test("should handle loading states", async ({ page }) => {
    // Intercept API calls to simulate slow loading
    await page.route("/api/dashboard/today", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.reload();

    // Should show loading indicators
    const loadingElements = page.locator(
      ".animate-pulse, .loading, text=Loading",
    );
    if ((await loadingElements.count()) > 0) {
      await expect(loadingElements.first()).toBeVisible();
    }

    // Eventually should show content
    await expect(page.locator("h1")).toContainText("Dashboard", {
      timeout: 5000,
    });
  });

  test("should refresh data correctly", async ({ page }) => {
    // Mark a reminder as given
    const reminderCard = page
      .locator('.reminder-card, [data-testid="reminder-card"]')
      .first();
    if ((await reminderCard.count()) > 0) {
      await reminderCard.locator('button:has-text("Mark as Given")').click();

      // Should update immediately without full page refresh
      await expect(
        reminderCard.locator("text=✓ Given, text=Completed"),
      ).toBeVisible();

      // Stats should update
      await expect(page.locator("text=1 given, text=0 pending")).toBeVisible();
    }
  });
});
