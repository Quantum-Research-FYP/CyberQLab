const networkNames = new Set(["MongoServerSelectionError", "MongoNetworkError", "MongoNetworkTimeoutError", "MongoOperationTimeoutError", "MongoTopologyClosedError", "MongoPoolClosedError", "MongoWaitQueueTimeoutError", "MongoNotConnectedError", "DatabaseConnectionTimeoutError"]);
const networkCodes = new Set(["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ETIMEOUT", "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR"]);

export function databaseErrorDetails(error) {
  const pending = [error], seen = new Set();
  let unavailable = false, category = "unknown", code = "";
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    if (networkNames.has(current.name) || networkCodes.has(current.code)) unavailable = true;
    if (typeof current.code === "string" && /^[A-Z][A-Z0-9_]+$/.test(current.code)) code = current.code;
    if (current.name === "MongoOperationTimeoutError" && category === "unknown") category = "timeout";
    if (current.code === 18 || current.code === 13) { unavailable = true; category = "access"; }
    if (current.code?.toString().startsWith("ERR_SSL") || /tlsv1 alert|SSL alert/i.test(current.message || "")) { unavailable = true; category = "tls"; }
    else if (category !== "tls" && (/^query(Srv|Txt)$/i.test(current.syscall || "") || /query(Srv|Txt)/i.test(current.message || ""))) category = "dns";
    else if (category !== "tls" && category !== "dns" && ["ETIMEDOUT", "ETIMEOUT"].includes(current.code)) category = "timeout";
    else if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"].includes(current.code) && !["tls", "dns"].includes(category)) category = "network";
    pending.push(current.cause);
    if (current.reason?.servers instanceof Map) for (const server of current.reason.servers.values()) pending.push(server.error);
  }
  return { unavailable, category, code };
}
