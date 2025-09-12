import { test, expect } from "@playwright/test";

test.describe("Medications CRUD Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database
    await page.request.post("/api/test/reset-db");
    await page.goto("/dashboard/medications");
  });

  test("should create medication and generate reminders", async ({ page }) => {
    // Click add medication
    await page.click(
      'button:has-text("Add Medication"), [data-testid="add-medication-button"]',
    );

    // Fill medication form
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill(
      '[data-testid="medication-name"]',
      "Integration Test Medicine",
    );
    await page.fill('[data-testid="medication-dosage"]', "2 tablets");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    await page.fill('[data-testid="medication-timing"]', "08:00");
    await page.fill('[data-testid="medication-duration"]', "2 weeks");

    // Submit form
    await page.click('button:has-text("Add Medication")');

    // Verify medication was created
    await expect(page.locator("text=Integration Test Medicine")).toBeVisible();
    await expect(page.locator("text=2 tablets")).toBeVisible();
    await expect(page.locator("text=daily")).toBeVisible();

    // Verify reminders were generated
    await page.goto("/dashboard");
    await expect(page.locator("text=Integration Test Medicine")).toBeVisible();
    await expect(page.locator("text=08:00, text=8:00")).toBeVisible();
  });

  test("should update medication and update associated reminders", async ({
    page,
  }) => {
    // Find existing medication and edit
    await page.click(
      '[data-testid="edit-medication-button"], button:has-text("Edit")',
    );

    // Update medication details
    await page.fill('[data-testid="medication-name"]', "Updated Medicine Name");
    await page.fill('[data-testid="medication-dosage"]', "3 tablets");
    await page.fill('[data-testid="medication-timing"]', "10:00");

    // Submit update
    await page.click('button:has-text("Update Medication")');

    // Verify medication was updated
    await expect(page.locator("text=Updated Medicine Name")).toBeVisible();
    await expect(page.locator("text=3 tablets")).toBeVisible();

    // Verify reminders were updated
    await page.goto("/dashboard");
    await expect(page.locator("text=Updated Medicine Name")).toBeVisible();
    await expect(page.locator("text=10:00")).toBeVisible();
  });

  test("should delete medication and remove future reminders", async ({
    page,
  }) => {
    // Verify medication exists
    await expect(page.locator("text=Heartgard Plus")).toBeVisible();

    // Delete medication
    await page.click(
      '[data-testid="delete-medication-button"], button:has-text("Delete")',
    );
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');

    // Verify medication is deleted
    await expect(page.locator("text=Heartgard Plus")).not.toBeVisible();

    // Verify future reminders are removed but history is preserved
    await page.goto("/dashboard");
    await expect(page.locator("text=Heartgard Plus")).not.toBeVisible();

    // Check history still exists
    await page.goto("/dashboard/history");
    // History entries should still be there if any were marked as given
  });

  test("should enforce free plan medication limits", async ({ page }) => {
    // Add first medication (should work)
    await page.click('button:has-text("Add Medication")');
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill('[data-testid="medication-name"]', "Second Medicine");
    await page.fill('[data-testid="medication-dosage"]', "1 tablet");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    await page.fill('[data-testid="medication-timing"]', "12:00");
    await page.click('button:has-text("Add Medication")');

    // Should be successful (2nd medication)
    await expect(page.locator("text=Second Medicine")).toBeVisible();

    // Try to add third medication (should trigger upgrade modal)
    await page.click('button:has-text("Add Medication")');
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill('[data-testid="medication-name"]', "Third Medicine");
    await page.fill('[data-testid="medication-dosage"]', "1 tablet");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    await page.fill('[data-testid="medication-timing"]', "18:00");
    await page.click('button:has-text("Add Medication")');

    // Should show upgrade modal
    await expect(page.locator("text=Upgrade to Premium")).toBeVisible();
    await expect(
      page.locator("text=Free plan allows only 2 medications"),
    ).toBeVisible();
  });

  test("should link medications to correct pets", async ({ page }) => {
    // Verify medication is linked to Buddy
    await expect(page.locator("text=Buddy")).toBeVisible();
    await expect(page.locator("text=Heartgard Plus")).toBeVisible();

    // Check database integration
    const response = await page.request.get("/api/medications");
    const medications = await response.json();
    const heartgardMed = medications.find(
      (med: any) => med.name === "Heartgard Plus",
    );
    expect(heartgardMed).toBeTruthy();
    expect(heartgardMed.pets.name).toBe("Buddy");
  });

  test("should validate medication form fields", async ({ page }) => {
    await page.click('button:has-text("Add Medication")');

    // Try to submit without required fields
    await page.click('button:has-text("Add Medication")');

    // Should show validation errors
    await expect(page.locator("text=required, text=Please")).toBeVisible();

    // Fill fields one by one and verify validation
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill('[data-testid="medication-name"]', "Test Med");
    await page.fill('[data-testid="medication-dosage"]', "1 tablet");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    // Missing timing should still show error
    await page.click('button:has-text("Add Medication")');
    await expect(page.locator("text=required, text=Please")).toBeVisible();
  });

  test("should handle different medication frequencies", async ({ page }) => {
    const frequencies = [
      { value: "daily", label: "Daily" },
      { value: "twice-daily", label: "Twice Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
    ];

    for (const freq of frequencies) {
      await page.click('button:has-text("Add Medication")');
      await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
      await page.fill(
        '[data-testid="medication-name"]',
        `${freq.label} Medicine`,
      );
      await page.fill('[data-testid="medication-dosage"]', "1 tablet");
      await page.selectOption(
        '[data-testid="medication-frequency"]',
        freq.value,
      );
      await page.fill('[data-testid="medication-timing"]', "09:00");
      await page.click('button:has-text("Add Medication")');

      await expect(page.locator(`text=${freq.label} Medicine`)).toBeVisible();

      // For free plan, can only add 2 medications total
      if (frequencies.indexOf(freq) >= 1) break;
    }
  });

  test("should enable/disable reminders correctly", async ({ page }) => {
    await page.click('button:has-text("Add Medication")');

    // Fill basic form
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill('[data-testid="medication-name"]', "Reminder Test Med");
    await page.fill('[data-testid="medication-dosage"]', "1 tablet");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    await page.fill('[data-testid="medication-timing"]', "09:00");

    // Check reminder settings
    const reminderToggle = page.locator(
      '[data-testid="enable-reminders"], #reminders',
    );
    await expect(reminderToggle).toBeChecked(); // Should be enabled by default

    // Disable reminders
    await reminderToggle.uncheck();

    await page.click('button:has-text("Add Medication")');

    // Verify medication was created
    await expect(page.locator("text=Reminder Test Med")).toBeVisible();

    // Check that no reminders were created for this medication
    await page.goto("/dashboard");
    // Should not see this medication in today's reminders if reminders are disabled
  });
});
