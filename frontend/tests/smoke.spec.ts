import { test, expect } from '@playwright/test';

test.describe('Predicting Crop Yield - Smoke Tests', () => {
  test('Landing page loads with exact title and CTAs', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page).toHaveTitle(/Predicting Crop Yield Using Environmental and Agricultural Factors/);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Predicting Crop Yield Using Environmental and Agricultural Factors');
    
    // Check CTAs
    await expect(page.getByRole('link', { name: /Try the Predictor/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore the Data/i })).toBeVisible();
  });

  test('Navbar displays shortened title and navigation links', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toContainText('Predicting Crop Yield');
    await expect(nav.getByRole('link', { name: /Predictor/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Model Lab/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Explorer/i })).toBeVisible();
  });

  test('Yield Predictor page renders controls and radial gauge', async ({ page }) => {
    await page.goto('/predict');
    
    await expect(page.locator('h1')).toContainText('Live Yield Predictor');
    await expect(page.getByLabel(/Year/i).first()).toBeVisible();
    await expect(page.getByLabel(/Rainfall/i).first()).toBeVisible();
    await expect(page.getByLabel(/Temperature/i).first()).toBeVisible();
    await expect(page.getByText(/Predicted Yield/i)).toBeVisible();
  });

  test('Model Lab loads comparison table and metrics', async ({ page }) => {
    await page.goto('/models');
    
    await expect(page.locator('h1')).toContainText('Model Lab');
    await expect(page.getByText(/Multiple Linear/i)).toBeVisible();
    await expect(page.getByText(/R²/i).first()).toBeVisible();
  });

  test('Scenarios page loads with warming slider and caution card', async ({ page }) => {
    await page.goto('/scenarios');
    
    await expect(page.locator('h1')).toContainText('Climate Scenario Simulator');
    await expect(page.getByText(/Important Caveats/i)).toBeVisible();
    await expect(page.getByText(/Association, not causation/i)).toBeVisible();
  });

  test('Methodology page displays pipeline and honest limitations', async ({ page }) => {
    await page.goto('/methodology');
    
    await expect(page.locator('h1')).toContainText('Methodology & Limitations');
    await expect(page.getByText(/Data Science Pipeline/i)).toBeVisible();
    await expect(page.getByText(/Key Honesty Points/i)).toBeVisible();
  });
});
