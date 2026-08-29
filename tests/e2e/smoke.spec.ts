import { test, expect } from "@playwright/test";

test("homepage loads with example carousel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /swan that audits/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Example audits" })).toBeVisible();
  await expect(page.getByTestId("example-truncated-axis")).toBeVisible();
});

test("clicking an example navigates to frozen audit page", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("example-truncated-axis").click();
  await expect(page).toHaveURL(/\/audit\/truncated-axis$/);
  await expect(
    page.getByRole("heading", { name: "Audit complete" }),
  ).toBeVisible();
  await expect(page.getByLabel(/Grade D/i)).toBeVisible();
});
