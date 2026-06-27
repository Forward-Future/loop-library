#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import process from "node:process";

import { normalizeLoopDocument } from "../src/loop-schema.js";

const [file, ...flags] = process.argv.slice(2);

if (!file || flags.some((flag) => !["--draft", "--archive"].includes(flag))) {
  console.error("Usage: npm run loop:publish -- <loop.json> [--draft|--archive]");
  process.exit(2);
}

const token = process.env.LOOP_PUBLISH_TOKEN;
const endpoint = (process.env.LOOP_LIBRARY_ENDPOINT ||
  "https://loop-library-forms.mberman84.workers.dev").replace(/\/$/, "");
const actor = process.env.LOOP_PUBLISHER || process.env.USER || "publisher-cli";

if (!token) {
  console.error("Set LOOP_PUBLISH_TOKEN before publishing.");
  process.exit(2);
}

const input = JSON.parse(await readFile(file, "utf8"));
const loop = normalizeLoopDocument(input.loop || input);
const status = flags.includes("--draft")
  ? "draft"
  : flags.includes("--archive")
    ? "archived"
    : "published";
const currentResponse = await fetch(`${endpoint}/admin/loops/${loop.slug}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "X-Loop-Publisher": actor,
  },
});
let expectedRevision = 0;
if (currentResponse.ok) {
  expectedRevision = (await currentResponse.json()).loop.revision;
} else if (currentResponse.status !== 404) {
  const currentResult = await currentResponse.json().catch(() => ({}));
  console.error(
    currentResult.error ||
      `Could not read the current loop revision (HTTP ${currentResponse.status}).`,
  );
  process.exit(1);
}
const response = await fetch(`${endpoint}/admin/loops/${loop.slug}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Loop-Publisher": actor,
  },
  body: JSON.stringify({ loop, status, expectedRevision }),
});
const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(result.error || `Publishing failed with HTTP ${response.status}.`);
  process.exit(1);
}

const verb = status === "published" ? "Published" : status === "draft" ? "Saved draft" : "Archived";
console.log(`${verb}: https://signals.forwardfuture.com/loop-library/loops/${loop.slug}/`);
