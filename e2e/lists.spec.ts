import { test, expect } from "@playwright/test";
import { getSongs, registerViaApi } from "./helpers";

test("creating a list from a song page and adding a second song", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const user = await registerViaApi(`e2elist${suffix}`);
  const songs = await getSongs();

  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', user.user.email);
  await page.fill('input[placeholder="Password"]', "testpass123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  await page.goto(`/songs/${songs[2].id}`);
  await page.click('button:has-text("Add to list")');
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="New list name"]', "E2E Test List");
  await page.click('button:has-text("Create")');
  await page.waitForTimeout(1000);
  await expect(page.locator("text=✓ E2E Test List")).toBeVisible();

  await page.goto(`/songs/${songs[3].id}`);
  await page.click('button:has-text("Add to list")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("E2E Test List")');
  await page.waitForTimeout(1000);

  await page.goto(`/profile/${user.user.id}`);
  await expect(page.locator("text=E2E Test List")).toBeVisible();
  await expect(page.locator("text=2 songs")).toBeVisible();
});
