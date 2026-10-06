import test from "node:test";
import assert from "node:assert/strict";
import { connectWithDeadline } from "../app/lib/connection-deadline.mjs";

test("a stalled DNS/connect promise cannot block the request indefinitely", async () => {
  let finish, closes=0;
  const client={connect:()=>new Promise(resolve=>{finish=resolve;}),close:async()=>{closes++;}};
  await assert.rejects(connectWithDeadline(client,20),error=>error.name==='DatabaseConnectionTimeoutError'&&error.code==='ETIMEDOUT');
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(closes>=1);
  const before=closes;
  finish(client);
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(closes>before,"a connection completing after the deadline is closed");
});

test("successful connections and genuine failures retain their result",async()=>{
  const client={connect:async()=>client,close:async()=>{throw Error('Must not close a healthy connection');}};
  assert.equal(await connectWithDeadline(client,100),client);
  const failure=Object.assign(new Error('querySrv ETIMEOUT'),{code:'ETIMEOUT'});
  await assert.rejects(connectWithDeadline({connect:async()=>{throw failure;},close:async()=>{}},100),error=>error===failure);
});
