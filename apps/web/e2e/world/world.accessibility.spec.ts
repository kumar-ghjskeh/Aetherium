import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { guardWorldRuntime, openRenderedWorld } from "./world-test-helpers";

test("supports keyboard-only world dialogs and accessibility controls", async ({ page }) => {
  const guard = guardWorldRuntime(page);
  await openRenderedWorld(page);

  const mapTrigger = page.getByRole("button", { name: "Map" });
  await mapTrigger.focus();
  await page.keyboard.press("Enter");
  const mapDialog = page.getByRole("dialog", { name: "Aetherium world map" });
  await expect(mapDialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close world map" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Walk", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(mapTrigger).toBeFocused();

  const accessibilityTrigger = page.getByRole("button", { name: "Access" });
  await accessibilityTrigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "World accessibility settings" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close accessibility settings" })).toBeFocused();

  for (const name of [
    /Reduced motion/,
    /Weather particles/,
    /High contrast/,
    /Dynamic weather/,
    /Sound captions/,
    /Reduced sensory audio/
  ]) {
    const control = page.getByRole("checkbox", { name });
    await control.focus();
    await page.keyboard.press("Space");
  }
  const largestText = page.getByRole("radio", { name: "Largest" });
  await largestText.focus();
  await page.keyboard.press("Enter");

  const frame = page.locator(".world-runtime-frame");
  await expect(frame).toHaveAttribute("data-high-contrast", "true");
  await expect(frame).toHaveAttribute("data-particles", "false");
  await expect(frame).toHaveAttribute("data-reduced-motion", "true");
  await expect(frame).toHaveAttribute("data-text-scale", "largest");
  await expect(page.getByRole("checkbox", { name: /Camera shake/ })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: /Cinematic travel/ })).toBeDisabled();

  const accessibilityScan = await new AxeBuilder({ page })
    .include(".world-accessibility-overlay")
    .analyze();
  expect(accessibilityScan.violations).toEqual([]);
  await expect(dialog).toHaveScreenshot("world-accessibility-high-contrast.png");

  await page.keyboard.press("Escape");
  await expect(accessibilityTrigger).toBeFocused();
  await expect(dialog).toBeHidden();
  guard.assertClean();
});
