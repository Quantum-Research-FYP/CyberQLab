import { test, expect } from "@playwright/test";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { sections } from "../../app/lib/course-content.mjs";
import { digest } from "../../app/lib/auth-utils.mjs";

nextEnv.loadEnvConfig(process.cwd());

test("profile shows persisted course stats and keeps progress private", async ({ page, context, browser, baseURL }, testInfo) => {
  const emails = [1,2].map(()=>`cyberq-profile-${randomUUID()}@example.invalid`);
  const password = "A long test-only passphrase!";
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "cyberq_lab");
  let otherContext;
  try {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login$/);
    const anonymous = await page.request.get("/api/learning");
    expect(anonymous.status()).toBe(401);
    const signup = await page.request.post("/api/auth/signup", { headers: { Origin: baseURL }, data: { name: "Profile Learner", email: emails[0], password, confirmPassword: password } });
    expect(signup.status()).toBe(201);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile Learner" })).toBeVisible();
    await expect(page.locator(".profile-stat").filter({hasText:"Questions answered"})).toContainText("0 / 60");
    await expect(page.locator(".profile-stat").filter({hasText:"Quiz accuracy"})).toContainText("—");
    await page.getByRole("link", { name: "Start learning", exact: true }).click();
    await page.getByRole("button", { name: "View course" }).click();
    await page.locator(".reader-subnav").getByRole("button", { name: "Section quiz" }).click();
    await expect(page.locator(".quiz-answer-list button")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Next question" })).toBeDisabled();
    await page.screenshot({path:testInfo.outputPath('quiz-desktop-light.png'),fullPage:true});
    await page.setViewportSize({width:375,height:812});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath('quiz-mobile-light.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    for (let question=0;question<5;question++) {
      const choice = sections[0].quiz[question][2];
      await page.locator(".quiz-answer-list button").nth(choice).click();
      await Promise.all([
        page.waitForResponse(response=>response.url().endsWith('/api/learning')&&response.request().method()==='PATCH'&&response.request().postDataJSON()?.type==='answer'&&response.request().postDataJSON()?.question===question&&response.status()===200),
        page.getByRole("button", { name: "Check", exact: true }).click(),
      ]);
      if (question < 4) await page.getByRole("button", { name: "Next question" }).click();
    }
    await page.getByRole("button", { name: "Profile options", exact: true }).click();
    await page.getByRole("link", { name: "View your profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator(".profile-stat").filter({hasText:"Sections completed"})).toContainText("1 / 12");
    await expect(page.locator(".profile-stat").filter({hasText:"Questions answered"})).toContainText("5 / 60");
    await expect(page.locator(".profile-stat").filter({hasText:"Quiz accuracy"})).toContainText("100%");
    await expect(page.locator(".profile-current")).toContainText("Section 1 · Section quiz");
    await page.reload();
    await expect(page.locator(".profile-stat").filter({hasText:"Sections completed"})).toContainText("1 / 12");
    await page.screenshot({path:testInfo.outputPath('profile-desktop-light.png'),fullPage:true});
    await page.setViewportSize({width:375,height:812});
    await context.addCookies([{name:"cyberq_theme",value:"dark",url:baseURL}]);
    await page.reload();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath('profile-mobile-dark.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole("link",{name:"Continue learning"}).click();
    await expect(page.locator(".quiz-question-card.correct")).toHaveCount(1);
    await page.route('**/api/learning',route=>route.request().method()==='PATCH'?route.abort():route.continue());
    await page.locator(".quiz-answer-list button").nth((sections[0].quiz[0][2]+1)%3).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.locator(".learning-save-error")).toBeVisible();
    await page.unroute('**/api/learning');
    await page.getByRole('button',{name:'Retry save'}).click();
    await expect(page.locator(".learning-save-error")).toHaveCount(0);
    await page.getByRole("button", { name: "Profile options", exact: true }).click();
    await page.getByRole("link",{name:"View your profile"}).click();
    await expect(page.locator(".profile-stat").filter({hasText:"Quiz accuracy"})).toContainText("80%");
    const invalid = await page.request.patch("/api/learning",{headers:{Origin:baseURL},data:{type:"answer",section:12,question:0,choice:0}});
    expect(invalid.status()).toBe(400);
    const crossOrigin = await page.request.patch("/api/learning",{headers:{Origin:"https://untrusted.example"},data:{type:"answer",section:0,question:0,choice:0}});
    expect(crossOrigin.status()).toBe(403);
    otherContext=await browser.newContext();
    const secondSignup=await otherContext.request.post(`${baseURL}/api/auth/signup`,{headers:{Origin:baseURL},data:{name:"Another Learner",email:emails[1],password,confirmPassword:password}});
    expect(secondSignup.status()).toBe(201);
    const ownProgress=await otherContext.request.get(`${baseURL}/api/learning`);
    expect((await ownProgress.json()).answers).toEqual({});
    const stored=await db.collection("users").findOne({email:emails[0]});
    expect(stored.learning.answers[0][0]).toBe((sections[0].quiz[0][2]+1)%3);
  } finally {
    await otherContext?.close();
    for(const email of emails){
      const user=await db.collection("users").findOne({email});
      if(user){ await db.collection("sessions").deleteMany({userId:user._id});await db.collection("users").deleteOne({_id:user._id,email}); }
      await db.collection("auth_attempts").deleteMany({_id:{$regex:`^email:${digest(email)}:`}});
    }
    await client.close();
  }
});
