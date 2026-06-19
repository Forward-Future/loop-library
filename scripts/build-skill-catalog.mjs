import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { categories, getLoopCategory, loops, site } from "./loop-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillCatalogPath = path.join(
  root,
  "skills",
  "loop-library",
  "references",
  "catalog.md",
);
const publicMarkdownPath = path.join(root, "site", "catalog.md");
const publicJsonPath = path.join(root, "site", "catalog.json");

export const catalogSchemaVersion = 1;

export function renderCatalogMarkdown() {
  const titleBySlug = new Map(loops.map((loop) => [loop.slug, loop.title]));
  const lines = [
    "# Published Loop Library catalog",
    "",
    `Generated from \`scripts/loop-data.mjs\` (catalog updated ${site.updated}).`,
    `Live catalog: ${site.baseUrl}catalog.md`,
    `Machine-readable catalog: ${site.baseUrl}catalog.json`,
    "",
    "Search by outcome, trigger, artifact, evidence, category, or keyword. Treat",
    "adaptations and new designs as unpublished unless they appear at the live catalog",
    "URL above.",
    "",
  ];

  for (const loop of loops) {
    const url = `${site.baseUrl}loops/${loop.slug}/`;
    const related = loop.related
      .map((slug) => `[${titleBySlug.get(slug)}](${site.baseUrl}loops/${slug}/)`)
      .join(", ");

    lines.push(
      `## ${loop.number} — [${loop.title}](${url})`,
      "",
      `- Category: ${getLoopCategory(loop).label}`,
      `- Use when: ${loop.useWhen}`,
      `- Prompt: ${loop.prompt}`,
      `- Verify: ${loop.verifyTitle} ${loop.verifyDetail}`,
      `- Keywords: ${loop.keywords.join(", ")}`,
      `- Related: ${related}`,
      "",
    );
  }

  return lines.join("\n");
}

export function renderCatalogJson() {
  const loopBySlug = new Map(loops.map((loop) => [loop.slug, loop]));
  const catalog = {
    schemaVersion: catalogSchemaVersion,
    name: site.name,
    publisher: site.publisher,
    description: site.description,
    url: site.baseUrl,
    catalogUrl: `${site.baseUrl}catalog.json`,
    markdownUrl: `${site.baseUrl}catalog.md`,
    updated: site.updated,
    loopCount: loops.length,
    categories,
    loops: loops.map((loop) => {
      const category = getLoopCategory(loop);

      return {
        number: loop.number,
        slug: loop.slug,
        title: loop.title,
        url: `${site.baseUrl}loops/${loop.slug}/`,
        category,
        author: loop.author,
        published: loop.published,
        modified: loop.modified,
        description: loop.description,
        useWhen: loop.useWhen,
        prompt: loop.prompt,
        verification: {
          title: loop.verifyTitle,
          detail: loop.verifyDetail,
        },
        steps: loop.steps,
        why: loop.why,
        implementationNote: loop.note,
        keywords: loop.keywords,
        related: loop.related.map((slug) => {
          const relatedLoop = loopBySlug.get(slug);

          return {
            slug,
            title: relatedLoop.title,
            url: `${site.baseUrl}loops/${slug}/`,
          };
        }),
        ...(loop.sourceUrl ? { sourceUrl: loop.sourceUrl } : {}),
      };
    }),
  };

  return `${JSON.stringify(catalog, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const markdown = renderCatalogMarkdown();

  await Promise.all([
    writeFile(skillCatalogPath, markdown, "utf8"),
    writeFile(publicMarkdownPath, markdown, "utf8"),
    writeFile(publicJsonPath, renderCatalogJson(), "utf8"),
  ]);

  console.log(
    `Wrote skill fallback and public Markdown/JSON catalogs from ${loops.length} loops.`,
  );
}
