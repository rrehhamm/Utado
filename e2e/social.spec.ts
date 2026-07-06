import { test, expect } from "@playwright/test";
import { getSongs, logSongViaApi, registerViaApi } from "./helpers";

test("following a user surfaces their logs in the feed, and likes/comments work", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const viewer = await registerViaApi(`e2eviewer${suffix}`);
  const author = await registerViaApi(`e2eauthor${suffix}`);
  const songs = await getSongs();

  await logSongViaApi(author.accessToken, songs[1].id, 5, "e2e social test review");

  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', viewer.user.email);
  await page.fill('input[placeholder="Password"]', "testpass123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  await page.goto(`/profile/${author.user.id}`);
  await page.click('button:has-text("Follow")');
  await page.waitForTimeout(1000);

  await page.goto("/feed");
  await expect(page.locator("text=e2e social test review")).toBeVisible();

  await page.click('button:has-text("♡")');
  await page.waitForTimeout(500);
  await expect(page.locator('button:has-text("♥")')).toBeVisible();

  await page.click('button:has-text("Comment")');
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="Add a comment"]', "e2e comment");
  await page.click('button:has-text("Post")');
  await page.waitForTimeout(1000);
  await expect(page.locator("text=e2e comment")).toBeVisible();
});
