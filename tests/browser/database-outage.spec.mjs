import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";

let server;
const outageURL = "http://localhost:3102";

test.beforeAll(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3102"], {
    env: { ...process.env, MONGODB_URI: "mongodb://127.0.0.1:1", MONGODB_DB: "cyberq_unavailable_test" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("Outage server did not start")),20_000);
    server.stdout.on("data",data=>{if(data.toString().includes("Ready")){clearTimeout(timer);resolve();}});
    server.on("exit",code=>{clearTimeout(timer);reject(new Error(`Outage server exited: ${code}`));});
    server.stderr.on("data",()=>{});
  });
});
test.afterAll(async()=>{
  if(server && server.exitCode === null) await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM');});
});

test("database failures render a retry screen, keep the session, and preserve themes",async({page,context})=>{
  const token="a".repeat(64);
  await context.addCookies([{name:"cyberq_session",value:token,url:outageURL,httpOnly:true,sameSite:"Lax"},{name:"cyberq_theme",value:"dark",url:outageURL}]);
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(outageURL);
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading',{name:'We couldn’t connect'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect((await context.cookies()).find(cookie=>cookie.name==='cyberq_session')?.value).toBe(token);
  await page.getByRole('switch',{name:'Dark theme'}).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.goto(`${outageURL}/login`);
  await expect(page.getByRole('heading',{name:'We couldn’t connect'})).toBeVisible();
  expect((await context.cookies()).find(cookie=>cookie.name==='cyberq_session')?.value).toBe(token);
  expect(errors.filter(text=>/script tag while rendering|hydration|MongoServerSelectionError/i.test(text))).toEqual([]);
  const learning=await page.request.get(`${outageURL}/api/learning`);
  expect(learning.status()).toBe(503);
});
