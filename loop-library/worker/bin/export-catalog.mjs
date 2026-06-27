#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { chmod, open, rename, rm } from "node:fs/promises";
import process from "node:process";
import { pipeline } from "node:stream/promises";

const [output] = process.argv.slice(2);

if (!output) {
  console.error("Usage: npm run loops:export -- /private/path/catalog-backup.ndjson");
  process.exit(2);
}

const token = process.env.LOOP_PUBLISH_TOKEN;
const endpoint = (process.env.LOOP_LIBRARY_ENDPOINT ||
  "https://loop-library-forms.mberman84.workers.dev").replace(/\/$/, "");

if (!token) {
  console.error("Set LOOP_PUBLISH_TOKEN before exporting.");
  process.exit(2);
}

async function getJson(path) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Export failed with HTTP ${response.status}.`);
  }
  return result;
}

const snapshot = await getJson("/admin/loops/export");
const nonce = `${process.pid}.${Date.now()}`;
const temporaryOutput = `${output}.${nonce}.tmp`;
const temporaryRevisions = `${output}.${nonce}.revisions.tmp`;
let revisionHandle;

try {
  revisionHandle = await open(temporaryRevisions, "wx", 0o600);
  let revisionDigest = "0".repeat(64);
  let after = 0;
  let written = 0;
  while (written < snapshot.revisionCount) {
    const page = await getJson(
      `/admin/loops/export?after=${after}&max=${snapshot.maxRevisionId}&limit=50`,
    );
    if (!Array.isArray(page.revisions) || page.revisions.length === 0) {
      throw new Error("Revision export ended before the declared revision count.");
    }
    const chunkLines = [];
    for (const revision of page.revisions) {
      const line = `${JSON.stringify({ type: "revision", revision })}\n`;
      chunkLines.push(line);
      await revisionHandle.writeFile(line);
      after = revision.id;
      written += 1;
    }
    revisionDigest = createHash("sha256")
      .update(`${revisionDigest}\n${chunkLines.join("")}`)
      .digest("hex");
  }
  if (written !== snapshot.revisionCount || after !== snapshot.maxRevisionId) {
    throw new Error("Revision export did not match its snapshot watermark.");
  }
  await revisionHandle.sync();
  await revisionHandle.close();
  revisionHandle = undefined;

  const manifestWithoutId = {
    ...snapshot,
    revisionDigest,
  };
  const manifest = {
    ...manifestWithoutId,
    restoreId: createHash("sha256")
      .update(JSON.stringify(manifestWithoutId))
      .digest("hex"),
  };
  const outputHandle = await open(temporaryOutput, "wx", 0o600);
  await outputHandle.writeFile(
    `${JSON.stringify({ type: "manifest", manifest })}\n`,
  );
  await outputHandle.close();
  await pipeline(
    createReadStream(temporaryRevisions),
    createWriteStream(temporaryOutput, { flags: "a", mode: 0o600 }),
  );
  const syncHandle = await open(temporaryOutput, "r");
  await syncHandle.sync();
  await syncHandle.close();
  await rename(temporaryOutput, output);
  await chmod(output, 0o600);
  await rm(temporaryRevisions, { force: true });
  console.log(
    `Exported ${manifest.loops.length} loops and ${written} revisions to ${output}.`,
  );
} catch (error) {
  await revisionHandle?.close().catch(() => {});
  await Promise.all([
    rm(temporaryOutput, { force: true }).catch(() => {}),
    rm(temporaryRevisions, { force: true }).catch(() => {}),
  ]);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
