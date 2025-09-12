import { test, expect } from "@playwright/test";

test.describe("Reminders Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database
    await page.request.post("/api/test/reset-db");
    // Clear notification logs
    await page.request.delete("/api/test/mock/notifications");
  });

  test("should mark reminder as given and create history entry", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Find a pending reminder
    const reminderCard = page.locator('[data-testid="reminder-card"]').first();
    await expect(reminderCard).toBeVisible();

    // Verify it's pending
    await expect(
      reminderCard.locator("text=pending, text=Scheduled"),
    ).toBeVisible();

    // Mark as given
    await reminderCard.locator('button:has-text("Mark as Given")').click();

    // Verify status changed to given
    await expect(
      reminderCard.locator("text=✓ Given, text=Completed"),
    ).toBeVisible();

    // Check that history entry was created
    await page.goto("/dashboard/history");
    await expect(page.locator("text=Heartgard Plus")).toBeVisible();
    await expect(page.locator("text=given, .text-green")).toBeVisible();

    // Verify database integration
    const historyResponse = await page.request.get("/api/history");
    const history = await historyResponse.json();
    expect(history.some((entry: any) => entry.status === "given")).toBeTruthy();
  });

  test("should send notifications based on user preferences", async ({
    page,
  }) => {
    // Set notification preferences
    await page.goto("/dashboard/settings");

    // Ensure email notifications are enabled
    const emailToggle = page.locator(
      '[data-testid="email-notifications"], #email-notifications',
    );
    if (!(await emailToggle.isChecked())) {
      await emailToggle.check();
    }

    // Ensure push notifications are enabled
    const pushToggle = page.locator(
      '[data-testid="push-notifications"], #push-notifications',
    );
    if (!(await pushToggle.isChecked())) {
      await pushToggle.check();
    }

    await page.click('button:has-text("Save Notification Preferences")');

    // Trigger a reminder notification (simulate scheduled time)
    await page.request.post("/api/test/trigger-reminder", {
      data: {
        reminder_id: "test-reminder-1",
        pet_name: "Buddy",
        medication_name: "Heartgard Plus",
        dosage: "1 tablet",
        scheduled_time: new Date().toISOString(),
      },
    });

    // Check that notifications were sent
    const notificationsResponse = await page.request.get(
      "/api/test/mock/notifications",
    );
    const notifications = await notificationsResponse.json();

    expect(notifications.count).toBeGreaterThan(0);
    expect(
      notifications.notifications.some((n: any) => n.type === "email"),
    ).toBeTruthy();
    expect(
      notifications.notifications.some((n: any) => n.type === "push"),
    ).toBeTruthy();
  });

  test("should respect notification preferences", async ({ page }) => {
    // Disable email notifications, keep push enabled
    await page.goto("/dashboard/settings");

    const emailToggle = page.locator(
      '[data-testid="email-notifications"], #email-notifications',
    );
    if (await emailToggle.isChecked()) {
      await emailToggle.uncheck();
    }

    const pushToggle = page.locator(
      '[data-testid="push-notifications"], #push-notifications',
    );
    if (!(await pushToggle.isChecked())) {
      await pushToggle.check();
    }

    await page.click('button:has-text("Save Notification Preferences")');

    // Trigger reminder
    await page.request.post("/api/test/trigger-reminder", {
      data: {
        reminder_id: "test-reminder-2",
        pet_name: "Buddy",
        medication_name: "Apoquel",
        dosage: "16mg",
        scheduled_time: new Date().toISOString(),
      },
    });

    // Check notifications
    const notificationsResponse = await page.request.get(
      "/api/test/mock/notifications",
    );
    const notifications = await notificationsResponse.json();

    // Should only have push notifications, no email
    const emailNotifications = notifications.notifications.filter(
      (n: any) => n.type === "email",
    );
    const pushNotifications = notifications.notifications.filter(
      (n: any) => n.type === "push",
    );

    expect(emailNotifications.length).toBe(0);
    expect(pushNotifications.length).toBeGreaterThan(0);
  });

  test("should show correct reminder statuses and timing", async ({ page }) => {
    await page.goto("/dashboard");

    // Check for different reminder statuses
    const reminderCards = page.locator('[data-testid="reminder-card"]');
    await expect(reminderCards.first()).toBeVisible();

    // Check status indicators
    const statusBadges = page.locator('.badge, [data-testid="status-badge"]');
    await expect(statusBadges.first()).toBeVisible();

    // Check time display
    await expect(
      page.locator("text=09:00, text=9:00, text=18:00, text=6:00"),
    ).toBeVisible();
  });

  test("should handle overdue reminders correctly", async ({ page }) => {
    // Create an overdue reminder by setting time in the past
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 2); // 2 hours ago

    await page.request.post("/api/test/create-reminder", {
      data: {
        pet_name: "Buddy",
        medication_name: "Overdue Medicine",
        dosage: "1 tablet",
        scheduled_time: pastTime.toISOString(),
        status: "pending",
      },
    });

    await page.goto("/dashboard");

    // Should show overdue indicator
    await expect(page.locator("text=⚠️ Overdue, .text-red")).toBeVisible();

    // Should show alert banner
    await expect(
      page.locator("text=medication overdue, text=Overdue"),
    ).toBeVisible();

    // Mark overdue reminder as given
    const overdueCard = page.locator(
      '[data-testid="reminder-card"]:has-text("Overdue Medicine")',
    );
    await overdueCard.locator('button:has-text("Mark as Given")').click();

    // Should update to given status
    await expect(overdueCard.locator("text=✓ Given")).toBeVisible();
  });

  test("should show upcoming reminders", async ({ page }) => {
    // Create an upcoming reminder
    const upcomingTime = new Date();
    upcomingTime.setMinutes(upcomingTime.getMinutes() + 30); // 30 minutes from now

    await page.request.post("/api/test/create-reminder", {
      data: {
        pet_name: "Buddy",
        medication_name: "Upcoming Medicine",
        dosage: "1 tablet",
        scheduled_time: upcomingTime.toISOString(),
        status: "pending",
      },
    });

    await page.goto("/dashboard");

    // Should show upcoming indicator
    await expect(
      page.locator("text=⏰ Due Soon, text=Due in, .text-yellow"),
    ).toBeVisible();
  });

  test("should prevent double-dosing", async ({ page }) => {
    await page.goto("/dashboard");

    const reminderCard = page.locator('[data-testid="reminder-card"]').first();

    // Mark as given
    await reminderCard.locator('button:has-text("Mark as Given")').click();

    // Verify button is no longer available
    await expect(
      reminderCard.locator('button:has-text("Mark as Given")'),
    ).not.toBeVisible();

    // Should show completed status
    await expect(
      reminderCard.locator("text=✓ Given, text=Completed"),
    ).toBeVisible();

    // Should show completion message
    await expect(reminderCard.locator("text=Completed")).toBeVisible();
  });

  test("should group reminders by time periods", async ({ page }) => {
    await page.goto("/dashboard");

    // Check for time period groupings
    await expect(page.locator("text=Morning, text=🌅")).toBeVisible();
    await expect(page.locator("text=Evening, text=🌙")).toBeVisible();

    // Verify reminders are grouped correctly
    const morningSection = page.locator("text=Morning").locator("..");
    const eveningSection = page.locator("text=Evening").locator("..");

    // Morning should contain 9 AM reminder
    await expect(morningSection.locator("text=09:00, text=9:00")).toBeVisible();

    // Evening should contain 6 PM reminder
    await expect(eveningSection.locator("text=18:00, text=6:00")).toBeVisible();
  });

  test("should handle missed reminders", async ({ page }) => {
    // Simulate a missed reminder (past time, not marked as given)
    const missedTime = new Date();
    missedTime.setHours(missedTime.getHours() - 1);

    await page.request.post("/api/test/create-reminder", {
      data: {
        pet_name: "Buddy",
        medication_name: "Missed Medicine",
        dosage: "1 tablet",
        scheduled_time: missedTime.toISOString(),
        status: "missed",
      },
    });

    await page.goto("/dashboard");

    // Should show missed status
    await expect(page.locator("text=✗ Missed, .text-red")).toBeVisible();

    // Check history shows missed entry
    await page.goto("/dashboard/history");
    await expect(page.locator("text=Missed Medicine")).toBeVisible();
    await expect(page.locator("text=missed, .text-red")).toBeVisible();
  });
});
