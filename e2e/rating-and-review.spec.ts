import { test, expect } from "@playwright/test";
import { getSongs, registerViaApi } from "./helpers";

test("rating and reviewing a song shows up in Reviews and the profile Diary", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const username = `e2erate${suffix}`;
  const user = await registerViaApi(username);
  const songs = await getSongs();
  const song = songs[0];

  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', user.user.email);
  await page.fill('input[placeholder="Password"]', "testpass123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Unique per run: repeated runs hit the same song (songs[0]), and a static
  // string would accumulate multiple identical-text reviews on it over time,
  // making the locator below ambiguous (strict-mode violation) on reruns.
  const reviewText = `E2E test review ${suffix} - sounds great!`;

  await page.goto(`/songs/${song.id}`);
  const stars = page.locator('button[aria-label$="star"]:not([disabled])');
  await stars.nth(3).click();
  await page.fill("textarea", reviewText);
  await page.click('button:has-text("Save")');

  // Scoped to <p> specifically: the "Your log" textarea above also retains the
  // same text as its value after saving, and a plain text= locator matches both.
  // A generous timeout (rather than a blind sleep) absorbs save-request latency
  // and Next dev-mode route compilation without being a fixed guess either way.
  await expect(page.locator("p", { hasText: reviewText })).toBeVisible({ timeout: 10_000 });

  await page.goto(`/profile/${user.user.id}`);
  await expect(page.locator("p", { hasText: reviewText })).toBeVisible({ timeout: 10_000 });
});
