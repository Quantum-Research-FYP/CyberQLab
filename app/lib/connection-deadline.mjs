// The driver's serverSelectionTimeoutMS does not bound the initial SRV DNS lookup.
export async function connectWithDeadline(client, milliseconds = 8000) {
  let timer, expired = false;
  const connecting = client.connect();
  const close = () => { Promise.resolve().then(() => client.close()).catch(() => {}); };
  connecting.then(() => { if (expired) close(); }, () => {});
  try {
    return await Promise.race([
      connecting,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          close();
          const error = new Error("Database connection deadline exceeded");
          error.name = "DatabaseConnectionTimeoutError";
          error.code = "ETIMEDOUT";
          reject(error);
        }, milliseconds);
      }),
    ]);
  } finally { clearTimeout(timer); }
}
