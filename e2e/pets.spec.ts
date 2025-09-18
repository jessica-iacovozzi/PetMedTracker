import { test, expect } from "@playwright/test";

test.describe("Pets CRUD Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test database
    await page.request.post("/api/test/reset-db");
    await page.goto("/dashboard/pets");
  });

  test("should create a new pet successfully", async ({ page }) => {
    // Click add pet button
    await page.click(
      'button:has-text("Add Pet"), [data-testid="add-pet-button"]',
    );

    // Fill pet form
    await page.fill(
      '[data-testid="pet-name"], input[placeholder*="Buddy"]',
      "Integration Test Dog",
    );
    await page.selectOption('[data-testid="pet-species"], select', "dog");
    await page.fill(
      '[data-testid="pet-breed"], input[placeholder*="breed"]',
      "Golden Retriever",
    );
    await page.fill(
      '[data-testid="pet-age"], input[placeholder*="age"]',
      "3 years",
    );
    await page.fill(
      '[data-testid="pet-weight"], input[placeholder*="weight"]',
      "65 lbs",
    );

    // Submit form
    await page.click('button[type="submit"], button:has-text("Add Pet")');

    // Verify pet was created
    await expect(page.locator("text=Integration Test Dog")).toBeVisible();
    await expect(page.locator("text=Golden Retriever")).toBeVisible();

    // Verify database integration
    const response = await page.request.get("/api/pets");
    const pets = await response.json();
    expect(
      pets.some((pet: any) => pet.name === "Integration Test Dog"),
    ).toBeTruthy();
  });

  test("should update pet information", async ({ page }) => {
    // Find existing pet and click edit
    await page.click(
      '[data-testid="edit-pet-button"], button:has-text("Edit")',
    );

    // Update pet information
    await page.fill(
      '[data-testid="pet-name"], input[value*="Buddy"]',
      "Updated Buddy",
    );
    await page.fill('[data-testid="pet-breed"]', "Updated Breed");

    // Submit update
    await page.click('button:has-text("Update Pet")');

    // Verify update
    await expect(page.locator("text=Updated Buddy")).toBeVisible();
    await expect(page.locator("text=Updated Breed")).toBeVisible();
  });

  test("should delete pet and cascade delete medications", async ({ page }) => {
    // First, add a medication to the pet
    await page.goto("/dashboard/medications");
    await page.click('button:has-text("Add Medication")');

    // Fill medication form
    await page.selectOption('[data-testid="pet-select"]', { label: "Buddy" });
    await page.fill('[data-testid="medication-name"]', "Test Medicine");
    await page.fill('[data-testid="medication-dosage"]', "1 tablet");
    await page.selectOption('[data-testid="medication-frequency"]', "daily");
    await page.fill('[data-testid="medication-timing"]', "09:00");
    await page.click('button:has-text("Add Medication")');

    // Verify medication was created
    await expect(page.locator("text=Test Medicine")).toBeVisible();

    // Go back to pets and delete the pet
    await page.goto("/dashboard/pets");
    await page.click(
      '[data-testid="delete-pet-button"], button:has-text("Delete")',
    );

    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');

    // Verify pet is deleted
    await expect(page.locator("text=Buddy")).not.toBeVisible();

    // Verify medications are also deleted (cascade)
    await page.goto("/dashboard/medications");
    await expect(page.locator("text=Test Medicine")).not.toBeVisible();
  });

  test("should enforce free plan limits", async ({ page }) => {
    // Try to add a second pet (should trigger upgrade modal)
    await page.click('button:has-text("Add Pet")');

    await page.fill('[data-testid="pet-name"]', "Second Pet");
    await page.selectOption('[data-testid="pet-species"]', "cat");
    await page.click('button:has-text("Add Pet")');

    // Should show upgrade modal
    await expect(page.locator("text=Upgrade to Premium")).toBeVisible();
    await expect(
      page.locator("text=Free plan allows only 1 pet"),
    ).toBeVisible();

    // Cancel upgrade
    await page.click('button:has-text("Cancel")');

    // Pet should not be created
    await expect(page.locator("text=Second Pet")).not.toBeVisible();
  });

  test("should allow unlimited pets for premium users", async ({ page }) => {
    // Switch to premium user
    await page.request.post("/api/test/reset-db", {
      data: { userType: "premium" },
    });

    await page.reload();

    // Add multiple pets
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Add Pet")');
      await page.fill('[data-testid="pet-name"]', `Premium Pet ${i}`);
      await page.selectOption('[data-testid="pet-species"]', "dog");
      await page.click('button:has-text("Add Pet")');

      await expect(page.locator(`text=Premium Pet ${i}`)).toBeVisible();
    }

    // All pets should be visible
    await expect(page.locator("text=Premium Pet 1")).toBeVisible();
    await expect(page.locator("text=Premium Pet 2")).toBeVisible();
    await expect(page.locator("text=Premium Pet 3")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.click('button:has-text("Add Pet")');

    // Try to submit without required fields
    await page.click('button:has-text("Add Pet")');

    // Should show validation errors
    await expect(page.locator("text=required, text=Please fill")).toBeVisible();

    // Fill only name, not species
    await page.fill('[data-testid="pet-name"]', "Test Pet");
    await page.click('button:has-text("Add Pet")');

    // Should still show validation error for species
    await expect(page.locator("text=required, text=Please fill")).toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("/api/pets", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Database connection failed" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.click('button:has-text("Add Pet")');
    await page.fill('[data-testid="pet-name"]', "Error Test Pet");
    await page.selectOption('[data-testid="pet-species"]', "dog");
    await page.click('button:has-text("Add Pet")');

    // Should show error message
    await expect(page.locator("text=error, text=failed")).toBeVisible();
  });
});
