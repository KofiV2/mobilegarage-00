import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  test('404 page should be displayed for non-existent routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    // Should see 404 error
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
    await expect(page.getByRole('button', { name: /go.*home/i })).toBeVisible();
  });

  test('404 page should have working navigation buttons', async ({ page }) => {
    await page.goto('/error/404');

    // Click go home button
    await page.getByRole('button', { name: /go.*home/i }).click();

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });

  test('500 error page should be accessible', async ({ page }) => {
    await page.goto('/error/500');

    // Should see 500 error
    await expect(page.locator('text=/500|server error/i')).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh|try again/i }).first()).toBeVisible();
  });

  test('500 page should have contact support option', async ({ page }) => {
    await page.goto('/error/500');

    // Should have report issue or contact support button
    const contactButton = page.getByRole('button', { name: /report|contact|support/i });
    await expect(contactButton).toBeVisible();
  });
});
