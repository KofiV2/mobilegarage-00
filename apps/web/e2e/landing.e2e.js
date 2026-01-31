import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/3ON/i);
  });

  test('should display the logo', async ({ page }) => {
    const logo = page.locator('img[alt*="3ON"]').first();
    await expect(logo).toBeVisible();
  });

  test('should have a booking button', async ({ page }) => {
    const bookButton = page.getByRole('button', { name: /book|get started/i }).first();
    await expect(bookButton).toBeVisible();
  });

  test('should navigate to auth page when clicking book button', async ({ page }) => {
    const bookButton = page.getByRole('button', { name: /book|get started/i }).first();
    await bookButton.click();

    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that key elements are still visible
    await expect(page.locator('img[alt*="3ON"]').first()).toBeVisible();
  });
});
