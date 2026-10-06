export async function readBody(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid body");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new Error("Invalid body"); }
    chunks.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

