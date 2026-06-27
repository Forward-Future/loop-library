#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import process from "node:process";

import { normalizeLoopDocument } from "../src/loop-schema.js";

const [file, ...flags] = process.argv.slice(2);

if (!file || flags.some((flag) => flag !== "--print-digest")) {
  console.error(
    "Usage: npm run loops:import -- /private/path/bootstrap.json [--print-digest]",
  );
  process.exit(2);
}

const fileStat = await stat(file);
if ((fileStat.mode & 0o077) !== 0) {
  console.error("The bootstrap file must be owner-only (chmod 600).");
  process.exit(2);
}

const payload = JSON.parse(await readFile(file, "utf8"));
const inputLoops = Array.isArray(payload) ? payload : payload.loops;

if (!Array.isArray(inputLoops)) {
  console.error("The bootstrap file must be an array or an object with a loops array.");
  process.exit(2);
}

const loops = inputLoops.map(normalizeLoopDocument);
const digest = createHash("sha256").update(JSON.stringify(loops)).digest("hex");

if (flags.includes("--print-digest")) {
  console.log(digest);
  process.exit(0);
}

const token = process.env.LOOP_PUBLISH_TOKEN;
const endpoint = (process.env.LOOP_LIBRARY_ENDPOINT ||
  "https://loop-library-forms.mberman84.workers.dev").replace(/\/$/, "");
const actor = process.env.LOOP_PUBLISHER || process.env.USER || "catalog-bootstrap";

if (!token) {
  console.error("Set LOOP_PUBLISH_TOKEN before importing.");
  process.exit(2);
}

const response = await fetch(`${endpoint}/admin/loops/import`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Loop-Publisher": actor,
  },
  body: JSON.stringify({ loops, status: "published", activate: true }),
});
const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(result.error || `Import failed with HTTP ${response.status}.`);
  process.exit(1);
}

console.log(
  `Imported ${result.imported} published loops (${digest}) and activated the database catalog.`,
);
