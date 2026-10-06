import { test, expect } from "@playwright/test";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { digest } from "../../app/lib/auth-utils.mjs";

nextEnv.loadEnvConfig(process.cwd());

test("attack and migration whiteboards retain playback and focus across algorithms and screen sizes", async ({ page, context, baseURL }, testInfo) => {
  const email = `cyberq-whiteboard-${randomUUID()}@example.invalid`;
  const password = "A long test-only passphrase!";
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "cyberq_lab");
  try {
    const signup = await page.request.post("/api/auth/signup", { headers: { Origin: baseURL }, data: { name: "Whiteboard Learner", email, password, confirmPassword: password } });
    expect(signup.status()).toBe(201);
    await page.goto("/?workspace=lab&algorithm=RSA");
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await expect.poll(() => page.locator(".sidebar").evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(76);
    await expect.poll(() => page.locator(".main").evaluate(el => Math.round(el.getBoundingClientRect().left))).toBe(76);
    await page.locator(".sidebar").getByRole("button", { name: "ECDH", exact: true }).click();
    await expect(page.locator(".intro h1")).toHaveText("ECDH");
    await page.reload();
    await expect(page.getByRole("button", { name: "Expand navigation", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("navigation-collapsed-desktop.png"), animations: "disabled" });
    for (const algorithm of ["RSA", "Diffie–Hellman", "ECDH", "ECDSA", "DSA", "EdDSA / Ed25519"]) {
      await page.goto(`/?workspace=lab&algorithm=${encodeURIComponent(algorithm)}`);
      await page.locator(".journey-tabs button").nth(1).click();
      const board = page.locator(".quantum-whiteboard");
      await expect(board.getByRole("heading", { name: `${algorithm} attack whiteboard` })).toBeVisible();
      await board.getByRole("button", { name: "Focus mode", exact: true }).click();
      await expect(board).toHaveClass(/workflow-focus/);
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
      const next = board.locator(".rsa-step-actions button").last();
      for (let line = 0; line < (algorithm === "RSA" ? 7 : 6); line++) await next.click();
      await expect(board.locator(".rsa-lines .rsa-line")).toHaveCount(algorithm === "RSA" ? 7 : 6);
      await expect(next).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(board).not.toHaveClass(/workflow-focus/);
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
      if (algorithm === "RSA") {
        await board.getByRole("button", { name: /Reset/ }).click();
        await expect(board.locator(".rsa-lines .rsa-line")).toHaveCount(0);
        await board.locator(".rsa-speed select").selectOption("2");
        await board.locator(".rsa-play").click();
        await expect(board.locator(".rsa-lines .rsa-line").first()).toBeVisible();
        await board.getByRole("button", { name: "Pause", exact: true }).click();
        await board.getByRole("button", { name: "Focus mode", exact: true }).click();
        await board.getByRole("button", { name: "Edit primes" }).click();
        await expect(page.locator(".quantum-whiteboard")).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
      }
      await page.locator(".journey-tabs button").nth(2).click();
      const migration = page.locator(".postquantum-whiteboard");
      await expect(migration.getByRole("heading", { name: `${algorithm} migration whiteboard` })).toBeVisible();
      await migration.getByRole("button", { name: "Focus mode", exact: true }).click();
      await expect(migration).toHaveClass(/workflow-focus/);
      for (let line = 0; line < 5; line++) await migration.getByRole("button", { name: "Next migration step" }).click();
      await expect(migration.locator(".pq-ready-result")).toBeVisible();
      await expect(migration.getByRole("button", { name: "Next migration step" })).toBeDisabled();
      await migration.getByRole("button", { name: "Reset migration" }).click();
      await expect(migration.locator(".rsa-line")).toHaveCount(0);
      if (algorithm === "RSA") {
        await migration.locator(".rsa-speed select").selectOption("2");
        await migration.getByRole("button", { name: "Play migration", exact: true }).click();
        await expect(migration.locator(".rsa-line").first()).toBeVisible();
        await migration.getByRole("button", { name: "Pause", exact: true }).click();
      }
      await page.keyboard.press("Escape");
      await expect(migration).not.toHaveClass(/workflow-focus/);
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
      await page.locator(".journey-tabs button").nth(1).click();
    }
    await page.screenshot({ path: testInfo.outputPath("quantum-desktop-light.png"), fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await context.addCookies([{ name: "cyberq_theme", value: "dark", url: baseURL }]);
    await page.reload();
    await page.locator(".journey-tabs button").nth(1).click();
    const board = page.locator(".quantum-whiteboard");
    await board.getByRole("button", { name: "Focus mode", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await board.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await board.getByRole("button", { name: "Reset quantum attack" }).click();
    await expect(board.locator(".rsa-lines .rsa-line")).toHaveCount(0);
    await board.locator(".rsa-step-actions button").last().click();
    await expect(board.locator(".rsa-lines .rsa-line")).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath("quantum-mobile-dark-focus.png") });
    await board.getByRole("button", { name: "Exit focus", exact: true }).click();
    await expect(board).not.toHaveClass(/workflow-focus/);
    await page.locator(".journey-tabs button").nth(2).click();
    const migration = page.locator(".postquantum-whiteboard");
    await migration.getByRole("button", { name: "Focus mode", exact: true }).click();
    for (let line = 0; line < 5; line++) await migration.getByRole("button", { name: "Next migration step" }).click();
    await expect(migration.locator(".pq-ready-result")).toBeVisible();
    expect(await migration.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await migration.getByRole("button", { name: "Reset migration" }).click();
    await migration.evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: testInfo.outputPath("migration-mobile-dark-focus.png"), animations: "disabled" });
    await migration.getByRole("button", { name: "Exit focus", exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(page.locator(".sidebar")).toHaveClass(/open/);
    await expect(page.locator(".sidebar").getByRole("button", { name: "Foundations", exact: true }).locator(".sidebar-link-label")).toBeVisible();
    await expect.poll(() => page.locator(".sidebar").evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(246);
    await page.getByRole("button", { name: "Close navigation", exact: true }).click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await expect.poll(() => page.locator(".sidebar").evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(246);
    await page.reload();
    await expect(page.getByRole("button", { name: "Collapse navigation", exact: true })).toBeVisible();
  } finally {
    const user = await db.collection("users").findOne({ email });
    if (user) {
      await db.collection("sessions").deleteMany({ userId: user._id });
      await db.collection("users").deleteOne({ _id: user._id, email });
    }
    await db.collection("auth_attempts").deleteMany({ _id: { $regex: `^email:${digest(email)}:` } });
    await client.close();
  }
});
