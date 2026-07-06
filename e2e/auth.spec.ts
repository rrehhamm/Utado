import { test, expect } from "@playwright/test";

test.describe("auth", () => {
  test("registers, logs out, and logs back in", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const username = `e2eauth${suffix}`;
    const email = `${username}@example.com`;

    await page.goto("/register");
    await page.fill('input[placeholder="Username"]', username);
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', "testpass123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("http://localhost:3000/feed");
    await expect(page.locator("text=Log out")).toBeVisible();
    await page.click("text=Log out");
    await page.waitForTimeout(500);
    await expect(page.locator("nav").getByText("Log in")).toBeVisible();

    await page.goto("/login");
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', "testpass123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.goto("/discover");
    await expect(page.locator("text=Log out")).toBeVisible();
  });
});
