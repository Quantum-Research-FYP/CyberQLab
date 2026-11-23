import "server-only";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb.mjs";

export async function issueCertificate(userId, courseId) {
  const db = await getDatabase();
  const path = `learning.certificates.${courseId}`;
  const now = new Date();
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId), [path]: { $exists: false } },
    { $set: { [path]: { issuedAt: now } } },
  );
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { [path]: 1 } },
  );
  const issuedAt = user?.learning?.certificates?.[courseId]?.issuedAt || now;
  const id = createHash("sha256").update(`${userId}:${courseId}:${issuedAt.toISOString()}`).digest("hex").slice(0, 16).toUpperCase();
  return { id, issuedAt };
}

const escapeXml = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[character]);

export function renderCertificateSvg({ learnerName, courseTitle, issuedAt, certificateId }) {
  const name = escapeXml(learnerName);
  const title = escapeXml(courseTitle);
  const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Colombo" }).format(issuedAt);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990" role="img" aria-label="Course completion certificate for ${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset="1" stop-color="#edf4ff"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#6d5bd0"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#183153" flood-opacity=".12"/></filter>
  </defs>
  <rect width="1400" height="990" fill="url(#bg)"/>
  <rect x="42" y="42" width="1316" height="906" rx="18" fill="#fff" stroke="#172554" stroke-width="3" filter="url(#shadow)"/>
  <rect x="62" y="62" width="1276" height="866" rx="12" fill="none" stroke="#93c5fd" stroke-width="2"/>
  <path d="M62 205V62h143M1195 62h143v143M62 785v143h143M1195 928h143V785" fill="none" stroke="#2563eb" stroke-width="8"/>
  <g transform="translate(700 158)"><circle r="54" fill="url(#accent)"/><circle r="31" fill="none" stroke="#fff" stroke-width="3"/><ellipse rx="43" ry="16" fill="none" stroke="#fff" stroke-width="2" transform="rotate(35)"/><ellipse rx="43" ry="16" fill="none" stroke="#fff" stroke-width="2" transform="rotate(-35)"/><circle r="6" fill="#fff"/></g>
  <text x="700" y="252" text-anchor="middle" fill="#1d4ed8" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5">CYBERQ LAB</text>
  <text x="700" y="335" text-anchor="middle" fill="#0f172a" font-family="Georgia, serif" font-size="62">Certificate of Completion</text>
  <line x1="480" y1="374" x2="920" y2="374" stroke="#bfdbfe" stroke-width="2"/>
  <text x="700" y="433" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="23">This certificate is proudly presented to</text>
  <text x="700" y="536" text-anchor="middle" fill="#172554" font-family="Georgia, serif" font-size="68" font-style="italic">${name}</text>
  <path d="M355 568 Q700 583 1045 568" fill="none" stroke="#93c5fd" stroke-width="2"/>
  <text x="700" y="637" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="23">for successfully completing the course</text>
  <text x="700" y="704" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-size="38" font-weight="700">${title}</text>
  <g transform="translate(700 804)"><circle r="58" fill="url(#accent)"/><path d="M-25 0l17 18 35-41" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle r="46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></g>
  <text x="235" y="846" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="16">DATE OF COMPLETION</text>
  <text x="235" y="878" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-size="20" font-weight="700">${date}</text>
  <text x="1165" y="846" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="16">CERTIFICATE ID</text>
  <text x="1165" y="878" text-anchor="middle" fill="#0f172a" font-family="monospace" font-size="19" font-weight="700">${escapeXml(certificateId)}</text>
</svg>`;
}

const pdfText = value => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7E]/g, "?")
  .replace(/([\\()])/g, "\\$1");

const centeredText = (text, y, size, font = "F1", color = ".06 .09 .16") => {
  const safe = pdfText(text);
  const estimatedWidth = safe.length * size * (font === "F3" ? .48 : .52);
  const x = Math.max(45, (842 - estimatedWidth) / 2);
  return `${color} rg BT /${font} ${size} Tf ${x.toFixed(1)} ${y} Td (${safe}) Tj ET`;
};

export function renderCertificatePdf({ learnerName, courseTitle, issuedAt, certificateId }) {
  const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Colombo" }).format(issuedAt);
  const nameSize = Math.max(30, Math.min(50, 810 / Math.max(String(learnerName).length, 1)));
  const stream = [
    "q",
    ".90 .94 1 rg 0 0 842 595 re f",
    "1 1 1 rg 18 18 806 559 re f",
    ".07 .12 .31 RG 2 w 18 18 806 559 re S",
    ".15 .39 .92 rg 18 459 m 18 486 l 109 577 l 136 577 l h f",
    ".15 .39 .92 rg 706 18 m 733 18 l 824 109 l 824 136 l h f",
    ".84 .90 .98 rg 369 490 m 369 503.807 357.807 515 344 515 c 330.193 515 319 503.807 319 490 c 319 476.193 330.193 465 344 465 c 357.807 465 369 476.193 369 490 c f",
    "q .10 .32 .83 RG 1.8 w .707 .707 -.707 .707 344 490 cm 13 0 m 13 2.485 7.18 4.5 0 4.5 c -7.18 4.5 -13 2.485 -13 0 c -13 -2.485 -7.18 -4.5 0 -4.5 c 7.18 -4.5 13 -2.485 13 0 c S Q",
    "q .10 .32 .83 RG 1.8 w .707 -.707 .707 .707 344 490 cm 13 0 m 13 2.485 7.18 4.5 0 4.5 c -7.18 4.5 -13 2.485 -13 0 c -13 -2.485 -7.18 -4.5 0 -4.5 c 7.18 -4.5 13 -2.485 13 0 c S Q",
    ".10 .32 .83 rg 347 490 m 347 491.657 345.657 493 344 493 c 342.343 493 341 491.657 341 490 c 341 488.343 342.343 487 344 487 c 345.657 487 347 488.343 347 490 c f",
    ".10 .32 .83 rg BT /F2 15 Tf 2.8 Tc 382 484 Td (CYBERQ LAB) Tj 0 Tc ET",
    ".38 .45 .56 rg BT /F2 15 Tf 4 Tc 263 420 Td (CERTIFICATE OF COMPLETION) Tj 0 Tc ET",
    centeredText("This certificate is proudly presented to", 373, 20, "F1", ".38 .45 .56"),
    centeredText(learnerName, 306, nameSize, "F3", ".07 .12 .31"),
    ".40 .65 1 RG 1 w 218 285 m 624 285 l S",
    centeredText("for successfully completing the course", 249, 17, "F1", ".38 .45 .56"),
    centeredText(courseTitle, 198, 31, "F2"),
    ".15 .39 .92 rg 439 129 m 439 138.941 430.941 147 421 147 c 411.059 147 403 138.941 403 129 c 403 119.059 411.059 111 421 111 c 430.941 111 439 119.059 439 129 c f",
    "1 1 1 RG 3.5 w 1 J 1 j 412 129 m 419 122 l 431 136 l S",
    ".38 .45 .56 rg BT /F1 8 Tf 72 66 Td (DATE OF COMPLETION) Tj ET",
    `.07 .12 .31 rg BT /F2 11 Tf 72 47 Td (${pdfText(date)}) Tj ET`,
    ".38 .45 .56 rg BT /F1 8 Tf 606 66 Td (CERTIFICATE ID) Tj ET",
    `.07 .12 .31 rg BT /F2 10 Tf 606 47 Td (${pdfText(certificateId)}) Tj ET`,
    "Q",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>",
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${pdfText(`${courseTitle} Certificate`)}) /Author (CyberQ Lab) /Subject (Course completion certificate) /Keywords (${pdfText(`Certificate ${certificateId}, issued ${issuedAt.toISOString()}`)}) >>`,
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 8 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(document, "ascii");
}
