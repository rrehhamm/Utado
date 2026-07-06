import { test, expect } from "@playwright/test";
import { getSongs, logSongViaApi, registerViaApi } from "./helpers";

test("picking favorite songs and seeing recently rated songs on your profile", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const user = await registerViaApi(`e2efav${suffix}`);
  const songs = await getSongs();

  await logSongViaApi(user.accessToken, songs[9].id, 4);

  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', user.user.email);
  await page.fill('input[placeholder="Password"]', "testpass123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/feed/);

  await page.goto(`/profile/${user.user.id}`);
  await expect(page.locator("h2", { hasText: "Recently Rated" })).toBeVisible();
  await expect(page.locator("p", { hasText: songs[9].title }).first()).toBeVisible();

  await page.click("button:has-text('Edit')");
  await page.fill('input[placeholder="Search for a song to add…"]', songs[4].title.slice(0, 5));
  const option = page.locator("ul button", { hasText: songs[4].title }).first();
  await expect(option).toBeVisible();
  await option.click();
  await page.click("button:has-text('Save')");
  await page.waitForTimeout(1000);

  await expect(page.locator("p", { hasText: songs[4].title }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator("p", { hasText: songs[4].title }).first()).toBeVisible();
});
