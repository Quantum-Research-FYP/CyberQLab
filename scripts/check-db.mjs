import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { readFile, writeFile, chmod } from "node:fs/promises";
import { databaseErrorDetails } from "../app/lib/database-errors.mjs";
import { connectWithDeadline } from "../app/lib/connection-deadline.mjs";

nextEnv.loadEnvConfig(process.cwd());
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 6000, connectTimeoutMS: 6000, timeoutMS: 6000 });
try {
  await connectWithDeadline(client);
  const db = client.db(process.env.MONGODB_DB || "cyberq_lab");
  await db.command({ ping: 1 });
  console.log("MongoDB connection and ping succeeded.");
  if (process.argv.includes("--configure-standard")) {
    if (!uri.startsWith("mongodb+srv://")) {
      console.log("The connection already uses the standard non-SRV format.");
    } else {
      // Use hosts and DNS TXT options resolved and validated by the MongoDB driver.
      const parsed = new URL(uri);
      const options = new URLSearchParams(parsed.search);
      const hosts = client.options.hosts.map(host => host.toString()).join(",");
      for (const key of ["srvServiceName", "srvMaxHosts", "srvAllowedHostsSuffix"]) options.delete(key);
      if (client.options.replicaSet) options.set("replicaSet", client.options.replicaSet);
      if (client.options.credentials?.source) options.set("authSource", client.options.credentials.source);
      if (client.options.loadBalanced) options.set("loadBalanced", "true");
      options.set("tls", "true");
      const standardURI = `mongodb://${parsed.username}:${parsed.password}@${hosts}${parsed.pathname || "/"}?${options}`;
      const verified = new MongoClient(standardURI, { serverSelectionTimeoutMS: 6000, connectTimeoutMS: 6000, timeoutMS: 6000 });
      try {
        await connectWithDeadline(verified);
        await verified.db(process.env.MONGODB_DB || "cyberq_lab").command({ ping: 1 });
      } finally { await verified.close(); }
      const local = await readFile(".env.local", "utf8");
      const escaped = standardURI.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("$", "\\$");
      const assignment = `MONGODB_URI="${escaped}"`;
      const updated = /^MONGODB_URI\s*=/m.test(local) ? local.replace(/^MONGODB_URI\s*=.*$/m, () => assignment) : `${local}\n${assignment}\n`;
      await writeFile(".env.local", updated, { mode: 0o600 });
      await chmod(".env.local", 0o600);
      console.log("Verified standard connection saved in ignored .env.local. SRV/TXT lookups are no longer needed. Restart the app server.");
    }
  }
} catch (error) {
  const details = databaseErrorDetails(error);
  console.error("MongoDB connection failed:", error.name, details.code || details.category);
  if (["dns", "timeout"].includes(details.category)) {
    console.error("Check the DNS resolver. Atlas also provides a non-SRV connection string under Connect → Drivers; turn off the SRV Connection String toggle.");
  } else if (details.category === "tls" || details.category === "network") {
    console.error("Check Atlas Network Access, cluster status, and VPN/firewall access to port 27017.");
  } else if (details.category === "access") {
    console.error("Check the Atlas database user credentials and permissions.");
  }
  process.exitCode = 1;
} finally {
  // On a timed-out SRV query, close can wait for DNS. The helper also closes late connections.
  const timer = setTimeout(() => process.exit(process.exitCode || 0), 1000);
  await client.close();
  clearTimeout(timer);
}
