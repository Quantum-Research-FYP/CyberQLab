import test from "node:test";
import assert from "node:assert/strict";
import { databaseErrorDetails } from "../app/lib/database-errors.mjs";

test("recognizes the reported Atlas TLS error through topology details", () => {
  const tls = Object.assign(new Error("SSL alert number 80"), { code: "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR" });
  const network = Object.assign(new Error("TLS negotiation failed"), { name: "MongoNetworkError", cause: tls });
  const error = Object.assign(new Error("Server selection failed"), { name: "MongoServerSelectionError", reason: { servers: new Map([["server", { error: network }]]) } });
  assert.deepEqual(databaseErrorDetails(error), { unavailable: true, category: "tls", code: tls.code });
});

test("distinguishes unavailable databases from application bugs", () => {
  assert.equal(databaseErrorDetails(Object.assign(new Error("Connection refused"), { code: "ECONNREFUSED" })).unavailable, true);
  assert.equal(databaseErrorDetails(Object.assign(new Error("Unauthorized"), { code: 13 })).category, "access");
  assert.equal(databaseErrorDetails(new TypeError("Unexpected application failure")).unavailable, false);
  assert.equal(databaseErrorDetails(null).unavailable, false);
  const deadline = Object.assign(new Error("Operation deadline exceeded"), { name: "MongoOperationTimeoutError" });
  assert.equal(databaseErrorDetails(deadline).unavailable, true);
  assert.equal(databaseErrorDetails(deadline).category, "timeout");
  const cyclic = new Error("Unexpected error");cyclic.cause=cyclic;
  assert.equal(databaseErrorDetails(cyclic).unavailable, false);
});


test("classifies SRV timeout as DNS rather than unknown", () => {
  const error=Object.assign(new Error("querySrv ETIMEOUT _mongodb._tcp.cluster.example"),{code:"ETIMEOUT",syscall:"querySrv"});
  assert.deepEqual(databaseErrorDetails(error),{unavailable:true,category:"dns",code:"ETIMEOUT"});
});
