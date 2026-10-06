import { test, expect } from "@playwright/test";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { digest } from "../../app/lib/auth-utils.mjs";

nextEnv.loadEnvConfig(process.cwd());

test("themes, responsive forms, signup, sessions, login and logout", async ({ page, context, baseURL }, testInfo) => {
  const email = `cyberq-e2e-${randomUUID()}@example.invalid`;
  const password = "A long test-only passphrase!";
  const dbClient = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await dbClient.connect();
  const db = dbClient.db(process.env.MONGODB_DB || "cyberq_lab");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const post = (action, data, origin = baseURL) => page.request.post(`/api/auth/${action}`, { headers: { Origin: origin }, data });
  try {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("login-light.png"), fullPage: true });
    await page.getByRole("switch", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.getByRole("switch", { name: "Dark theme" })).toBeChecked();
    await page.screenshot({ path: testInfo.outputPath("login-dark.png"), fullPage: true });
    await page.getByRole("link", { name: "Sign up", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("signup-mobile-dark.png"), fullPage: true });
    await page.getByRole("switch", { name: "Dark theme" }).click();
    await page.screenshot({ path: testInfo.outputPath("signup-mobile-light.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByLabel("Full name").fill("Integration Learner");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill("different password");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.locator(".auth-error")).toContainText("passwords do not match");
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Profile options", exact: true })).toBeVisible();
    await expect(page.locator(".topbar").getByText("Glossary", { exact: true })).toHaveCount(0);
    await expect(page.locator(".topbar").getByRole("switch")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
    const profileOptions = page.getByRole("button", { name: "Profile options", exact: true });
    await profileOptions.click();
    await expect(page.locator(".profile-dropdown-identity")).toContainText(email);
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(profileOptions).toBeFocused();
    await expect(profileOptions).toHaveAttribute("aria-expanded", "false");
    await profileOptions.click();
    await page.locator(".intro h1").click();
    await expect(profileOptions).toHaveAttribute("aria-expanded", "false");
    const cookie = (await context.cookies()).find((item) => item.name === "cyberq_session");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
    const user = await db.collection("users").findOne({ email });
    expect(user.passwordHash).toMatch(/^scrypt-v1\$/);
    expect(user.password).toBeUndefined();
    expect(await db.collection("sessions").findOne({ _id: cookie.value })).toBeNull();
    expect(await db.collection("sessions").findOne({ _id: digest(cookie.value) })).toBeTruthy();
    await page.reload();
    await expect(page.getByRole("button", { name: "Profile options", exact: true })).toBeVisible();
    await page.goto("/login");
    await expect(page).toHaveURL(`${baseURL}/`);
    await page.getByRole("button", { name: "Profile options", exact: true }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await db.collection("sessions").findOne({ _id: digest(cookie.value) })).toBeNull();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    expect((await post("login", { email, password }, "https://untrusted.example")).status()).toBe(403);
    expect((await post("login", { email: { $ne: null }, password })).status()).toBe(400);
    expect((await post("signup", { name: "Duplicate", email: email.toUpperCase(), password, confirmPassword: password })).status()).toBe(409);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("an incorrect password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.locator(".auth-error")).toContainText("email or password is incorrect");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/`);
    const sessionCookie = (await context.cookies()).find((item) => item.name === "cyberq_session");
    await db.collection("sessions").updateOne({ _id: digest(sessionCookie.value) }, { $set: { expiresAt: new Date(0) } });
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    let limited = false;
    for (let i = 0; i < 11; i++) {
      const response = await post("login", { email, password: "incorrect password" });
      if (response.status() === 429) { limited = true; break; }
      expect(response.status()).toBe(401);
    }
    expect(limited).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    // Only remove records belonging to the disposable account created by this test.
    const user = await db.collection("users").findOne({ email });
    if (user) {
      await db.collection("sessions").deleteMany({ userId: user._id });
      await db.collection("users").deleteOne({ _id: user._id, email });
    }
    await db.collection("auth_attempts").deleteMany({ _id: { $regex: `^email:${digest(email)}:` } });
    await dbClient.close();
  }
});
