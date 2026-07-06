import { test, expect } from "@playwright/test";
import { getSongs } from "./helpers";

test("searching for a known artist surfaces it and links through to the artist page", async ({
  page,
}) => {
  await page.goto("/discover");
  await page.fill('input[placeholder*="Search"]', "kilo");
  await page.press('input[placeholder*="Search"]', "Enter");
  await page.waitForURL(/\/search\?q=kilo/);

  await expect(page.locator("h2", { hasText: "Artists" })).toBeVisible();
  const result = page.locator("a", { hasText: "Kilowatt" }).first();
  await expect(result).toBeVisible();

  await result.click();
  await page.waitForURL(/\/artists\//);
  await expect(page.locator("h1", { hasText: "Kilowatt" })).toBeVisible();
});

test("searching for a known song title surfaces it in results", async ({ page }) => {
  const songs = await getSongs();
  const target = songs[5];
  const query = target.title.slice(0, Math.max(3, Math.min(6, target.title.length)));

  await page.goto(`/search?q=${encodeURIComponent(query)}`);
  await expect(page.locator("h2", { hasText: "Songs" })).toBeVisible();
  await expect(page.locator("p", { hasText: target.title }).first()).toBeVisible();
});

test("searching for gibberish shows a no-results message instead of erroring", async ({ page }) => {
  await page.goto("/search?q=zzzznomatchzzzz");
  await expect(page.locator("text=No matches for")).toBeVisible();
});
