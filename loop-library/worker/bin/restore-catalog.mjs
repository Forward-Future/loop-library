#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import process from "node:process";
import readline from "node:readline";

const [file] = process.argv.slice(2);

if (!file) {
  console.error("Usage: npm run loops:restore -- /private/path/catalog-backup.ndjson");
  process.exit(2);
}

const fileStat = await stat(file);
if ((fileStat.mode & 0o077) !== 0) {
  console.error("The backup file must be owner-only (chmod 600).");
  process.exit(2);
}

const token = process.env.LOOP_PUBLISH_TOKEN;
const endpoint = (process.env.LOOP_LIBRARY_ENDPOINT ||
  "https://loop-library-forms.mberman84.workers.dev").replace(/\/$/, "");

if (!token) {
  console.error("Set LOOP_PUBLISH_TOKEN before restoring.");
  process.exit(2);
}

async function postJson(path, body) {
  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Restore failed with HTTP ${response.status}.`);
  }
  return result;
}

function backupLines() {
  return readline.createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
}

async function verifyBackup() {
  let manifest;
  let count = 0;
  let maxRevisionId = 0;
  let revisionDigest = "0".repeat(64);
  let chunkLines = [];
  for await (const line of backupLines()) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (!manifest) {
      if (record.type !== "manifest" || !record.manifest) {
        throw new Error("The first backup record must be a manifest.");
      }
      manifest = record.manifest;
      continue;
    }
    if (record.type !== "revision" || !record.revision) {
      throw new Error("Backup contains an invalid revision record.");
    }
    if (!Number.isSafeInteger(record.revision.id) || record.revision.id <= maxRevisionId) {
      throw new Error("Backup revision ids must be strictly increasing.");
    }
    const canonicalLine = `${JSON.stringify(record)}\n`;
    chunkLines.push(canonicalLine);
    if (chunkLines.length === 50) {
      revisionDigest = createHash("sha256")
        .update(`${revisionDigest}\n${chunkLines.join("")}`)
        .digest("hex");
      chunkLines = [];
    }
    maxRevisionId = record.revision.id;
    count += 1;
  }
  if (!manifest) throw new Error("Backup manifest is missing.");
  if (chunkLines.length) {
    revisionDigest = createHash("sha256")
      .update(`${revisionDigest}\n${chunkLines.join("")}`)
      .digest("hex");
  }
  if (count !== manifest.revisionCount || maxRevisionId !== manifest.maxRevisionId) {
    throw new Error("Backup revision count or watermark does not match its manifest.");
  }
  if (revisionDigest !== manifest.revisionDigest) {
    throw new Error("Backup revision digest does not match its history.");
  }
  const { restoreId, ...manifestWithoutId } = manifest;
  const expectedRestoreId = createHash("sha256")
    .update(JSON.stringify(manifestWithoutId))
    .digest("hex");
  if (restoreId !== expectedRestoreId) {
    throw new Error("Backup manifest digest is invalid.");
  }
  return manifest;
}

try {
  const manifest = await verifyBackup();
  const start = await postJson("/admin/loops/restore/start", manifest);
  if (start.completed) {
    console.log(
      `Restore already completed: ${start.restored} loops and ${start.revisions} revisions; active=${start.active}.`,
    );
    process.exit(0);
  }

  let sawManifest = false;
  let revisions = [];
  let seenRevisions = 0;
  const skipRevisions = start.acceptedRevisions || 0;
  for await (const line of backupLines()) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (!sawManifest) {
      sawManifest = true;
      continue;
    }
    seenRevisions += 1;
    if (seenRevisions <= skipRevisions) continue;
    revisions.push(record.revision);
    if (revisions.length === 50) {
      await postJson("/admin/loops/restore/chunk", {
        restoreId: manifest.restoreId,
        revisions,
      });
      revisions = [];
    }
  }
  if (revisions.length) {
    await postJson("/admin/loops/restore/chunk", {
      restoreId: manifest.restoreId,
      revisions,
    });
  }
  const result = await postJson("/admin/loops/restore/finalize", {
    restoreId: manifest.restoreId,
  });
  console.log(
    `Restored ${result.restored} loops and ${result.revisions} revisions; active=${result.active}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
