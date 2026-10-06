import "server-only";
import { MongoClient } from "mongodb";
import { connectWithDeadline } from "./connection-deadline.mjs";

const cache = globalThis.__cyberqMongo ??= { connection: null, indexes: null };

export async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error("MongoDB is not configured");
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB || "cyberq_lab";
  if (cache.uri !== uri || cache.databaseName !== databaseName) {
    cache.connection?.then(client => client.close()).catch(() => {});
    cache.uri = uri;
    cache.databaseName = databaseName;
    cache.connection = null;
    cache.indexes = null;
    cache.retryAt = 0;
    cache.lastError = null;
  }
  if (cache.retryAt > Date.now()) throw cache.lastError;
  if (!cache.connection) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 6000,
      waitQueueTimeoutMS: 6000,
      timeoutMS: 6000,
    });
    const connection = connectWithDeadline(client).catch((error) => {
      if (cache.connection === connection) {
        cache.connection = null;
        cache.indexes = null;
        cache.lastError = error;
        cache.retryAt = Date.now() + 3000;
      }
      // Closing can wait for DNS; cleanup must not extend the request deadline.
      Promise.resolve().then(() => client.close()).catch(() => {});
      throw error;
    });
    cache.connection = connection;
  }
  const client = await cache.connection;
  const db = client.db(databaseName);
  if (!cache.indexes) {
    cache.indexes = Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("auth_attempts").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).catch((error) => { cache.indexes = null; throw error; });
  }
  await cache.indexes;
  return db;
}
