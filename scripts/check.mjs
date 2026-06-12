import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");

const [html, css, script, dataSource] = await Promise.all([
  readFile(path.join(site, "index.html"), "utf8"),
  readFile(path.join(site, "styles.css"), "utf8"),
  readFile(path.join(site, "script.js"), "utf8"),
  readFile(path.join(site, ".herenow", "data.json"), "utf8"),
]);

const dataManifest = JSON.parse(dataSource);
const suggestions = dataManifest.collections?.suggestions;

assert(html.includes("The overnight docs sweep"));
assert(html.includes("The architecture satisfaction loop"));
assert(html.includes("The sub-50 ms page-load loop"));
assert(html.includes("Continue until every page loads in under 50 ms."));
assert(html.includes("Matthew Berman"));
assert(html.includes("Peter Steinberger"));
assert.equal((html.match(/class="loop-row"/g) || []).length, 3);
assert(html.includes('class="loop-table"'));
assert(!html.includes('class="loop-diagram"'));
assert(html.includes("Showing 3 loops"));
assert(html.includes("./styles.css?v=20260612-dark-mode"));
assert(html.includes("./script.js?v=20260612-dark-mode"));
assert(html.includes('id="theme-toggle"'));
assert(html.includes('document.documentElement.dataset.theme = theme'));
assert(html.includes('"loop-library-theme"'));
assert(html.includes('href="#tips"'));
assert(html.includes('id="tips"'));
assert(html.includes("Tips &amp; best practices"));
assert(html.includes("tmp/&lt;file&gt;"));
assert(html.includes("Temporary workspace only. Never store secrets."));
assert(html.includes('class="practice-table"'));
assert(html.includes('id="loop-form"'));
assert(html.includes("./.herenow/data/suggestions") === false);
assert(css.includes("--orange: #ff5033"));
assert(css.includes("--charcoal: #101010"));
assert(css.includes(".tips-section"));
assert(css.includes(".loop-table"));
assert(css.includes(':root[data-theme="dark"]'));
assert(css.includes(".theme-toggle"));
assert(!css.includes("box-shadow"));
assert(script.includes('fetch("./.herenow/data/suggestions"'));
assert(script.includes('document.querySelectorAll(".loop-row")'));
assert(script.includes('searchInput.addEventListener("input", updateLibrary)'));
assert(script.includes('searchInput.addEventListener("search", updateLibrary)'));
assert(script.includes('themeToggle.addEventListener("click"'));
assert(script.includes("window.localStorage.setItem(THEME_STORAGE_KEY, theme)"));
assert(!script.includes("innerHTML"));

assert.equal(suggestions.access.read, "owner");
assert.equal(suggestions.access.insert, "public");
assert.equal(suggestions.access.update, "owner");
assert.equal(suggestions.access.delete, "owner");
assert.equal(suggestions.rateLimit, "3/hour/ip");
assert(suggestions.fields.instructions.maxLength <= 3000);
assert(suggestions.fields.email.maxLength <= 160);
assert(suggestions.fields.source_url.maxLength <= 300);

console.log("Loop Library checks passed.");
