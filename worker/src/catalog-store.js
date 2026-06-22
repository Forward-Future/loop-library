function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

class CatalogConflictError extends Error {
  constructor(message, code = "invalid_catalog_graph") {
    super(message);
    this.code = code;
  }
}

export class LoopCatalog {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS loops (
        slug TEXT PRIMARY KEY,
        number TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
        published_date TEXT NOT NULL,
        modified_date TEXT NOT NULL,
        document_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS loops_number ON loops(number);
      CREATE INDEX IF NOT EXISTS loops_publication
        ON loops(status, published_date, number);
      CREATE TABLE IF NOT EXISTS loop_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        actor TEXT NOT NULL,
        document_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS loop_revisions_slug
        ON loop_revisions(slug, id DESC);
      CREATE TABLE IF NOT EXISTS catalog_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/published") {
      const metadata = [...this.sql.exec(
        `SELECT
           COUNT(*) AS total,
           MAX(CASE WHEN status = 'published' THEN modified_date END) AS updated
         FROM loops`,
      )][0];
      const activation = [...this.sql.exec(
        `SELECT value FROM catalog_settings
         WHERE key = 'public_catalog_active' LIMIT 1`,
      )][0];
      return jsonResponse({
        initialized: activation?.value === "1",
        updated: metadata.updated || null,
        loops: this.list("published"),
      });
    }

    if (request.method === "GET" && url.pathname === "/all") {
      return jsonResponse({ loops: this.list() });
    }

    if (request.method === "GET" && url.pathname === "/export") {
      const activation = [...this.sql.exec(
        `SELECT value, updated_at FROM catalog_settings
         WHERE key = 'public_catalog_active' LIMIT 1`,
      )][0];
      const revisionMetadata = [...this.sql.exec(
        `SELECT COUNT(*) AS revision_count, MAX(id) AS max_revision_id
         FROM loop_revisions`,
      )][0];
      return jsonResponse({
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        active: activation?.value === "1",
        activatedAt: activation?.updated_at || null,
        loops: this.list(),
        revisionCount: revisionMetadata.revision_count,
        maxRevisionId: revisionMetadata.max_revision_id || 0,
      });
    }

    if (request.method === "GET" && url.pathname === "/export/revisions") {
      const after = Number(url.searchParams.get("after"));
      const max = Number(url.searchParams.get("max"));
      const limit = Number(url.searchParams.get("limit"));
      const revisions = [...this.sql.exec(
        `SELECT id, slug, action, status, actor, document_json, created_at
         FROM loop_revisions
         WHERE id > ? AND id <= ?
         ORDER BY id ASC LIMIT ?`,
        after,
        max,
        limit,
      )].map((row) => ({
        id: row.id,
        slug: row.slug,
        action: row.action,
        status: row.status,
        actor: row.actor,
        loop: JSON.parse(row.document_json),
        createdAt: row.created_at,
      }));
      return jsonResponse({ revisions });
    }

    if (request.method === "POST" && url.pathname === "/restore/start") {
      const body = await request.json();
      try {
        const result = this.state.storage.transactionSync(() => {
          const completed = new Map(
            [...this.sql.exec(
              `SELECT key, value FROM catalog_settings
               WHERE key LIKE 'restore_completed_%'`,
            )].map((row) => [row.key, row.value]),
          );
          if (completed.get("restore_completed_id") === body.restoreId) {
            return {
              started: true,
              resumed: true,
              completed: true,
              restored: Number(completed.get("restore_completed_loops")),
              revisions: Number(completed.get("restore_completed_revisions")),
              active: completed.get("restore_completed_active") === "1",
            };
          }
          const existingRestore = [...this.sql.exec(
            `SELECT value FROM catalog_settings WHERE key = 'restore_id' LIMIT 1`,
          )][0];
          if (existingRestore?.value === body.restoreId) {
            const accepted = [...this.sql.exec(
              `SELECT COUNT(*) AS count FROM loop_revisions`,
            )][0].count;
            return { started: true, resumed: true, acceptedRevisions: accepted };
          }
          const counts = [...this.sql.exec(
            `SELECT
               (SELECT COUNT(*) FROM loops) AS loops,
               (SELECT COUNT(*) FROM loop_revisions) AS revisions,
               (SELECT COUNT(*) FROM catalog_settings) AS settings`,
          )][0];
          if (counts.loops || counts.revisions || counts.settings) {
            throw new CatalogConflictError(
              "Restore requires a fresh, empty catalog database.",
              "restore_requires_empty_catalog",
            );
          }

          this.assertCatalogIntegrity(body.loops);
          for (const { loop, status } of body.loops) {
            this.sql.exec(
              `INSERT INTO loops (
                 slug, number, title, status, published_date, modified_date,
                 document_json, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              loop.slug,
              loop.number,
              loop.title,
              status,
              loop.published,
              loop.modified,
              JSON.stringify(loop),
              body.exportedAt,
              body.exportedAt,
            );
          }
          const settings = {
            restore_id: body.restoreId,
            restore_revision_count: String(body.revisionCount),
            restore_max_revision_id: String(body.maxRevisionId),
            restore_revision_digest: body.revisionDigest,
            restore_stream_digest: "0".repeat(64),
            restore_last_revision_id: "0",
            restore_uploaded_count: "0",
            restore_active: body.active ? "1" : "0",
            restore_activated_at: body.activatedAt || "",
            restore_exported_at: body.exportedAt,
          };
          for (const [key, value] of Object.entries(settings)) {
            this.sql.exec(
              `INSERT INTO catalog_settings (key, value, updated_at)
               VALUES (?, ?, ?)`,
              key,
              value,
              body.exportedAt,
            );
          }
          return { started: true, resumed: false, acceptedRevisions: 0 };
        });
        return jsonResponse(result);
      } catch (error) {
        if (error instanceof CatalogConflictError) {
          return jsonResponse({ error: error.message, code: error.code }, 409);
        }
        throw error;
      }
    }

    if (request.method === "POST" && url.pathname === "/restore/chunk") {
      const body = await request.json();
      try {
        const restoreState = new Map(
          [...this.sql.exec(
            `SELECT key, value FROM catalog_settings WHERE key LIKE 'restore_%'`,
          )].map((row) => [row.key, row.value]),
        );
        if (restoreState.get("restore_id") !== body.restoreId) {
          throw new CatalogConflictError(
            "Restore session does not match the active restore.",
            "restore_session_mismatch",
          );
        }
        const previousDigest = restoreState.get("restore_stream_digest");
        const previousLastId = Number(restoreState.get("restore_last_revision_id"));
        const previousCount = Number(restoreState.get("restore_uploaded_count"));
        let lastId = previousLastId;
        for (const revision of body.revisions) {
          if (
            revision.id <= lastId ||
            revision.id > Number(restoreState.get("restore_max_revision_id"))
          ) {
            throw new CatalogConflictError(
              "Restore revisions must be uploaded once in ascending order.",
              "restore_revision_order",
            );
          }
          lastId = revision.id;
        }
        const nextDigest = await chainRevisionDigest(
          previousDigest,
          body.revisions,
        );
        const result = this.state.storage.transactionSync(() => {
          const currentState = new Map(
            [...this.sql.exec(
              `SELECT key, value FROM catalog_settings WHERE key IN (
                 'restore_id', 'restore_stream_digest',
                 'restore_last_revision_id', 'restore_uploaded_count'
               )`,
            )].map((row) => [row.key, row.value]),
          );
          if (
            currentState.get("restore_id") !== body.restoreId ||
            currentState.get("restore_stream_digest") !== previousDigest ||
            Number(currentState.get("restore_last_revision_id")) !== previousLastId ||
            Number(currentState.get("restore_uploaded_count")) !== previousCount
          ) {
            throw new CatalogConflictError(
              "Restore advanced concurrently; retry from the latest restore state.",
              "restore_concurrent_update",
            );
          }
          for (const revision of body.revisions) {
            const documentJson = JSON.stringify(revision.loop);
            const loop = [...this.sql.exec(
              `SELECT slug FROM loops WHERE slug = ? LIMIT 1`,
              revision.slug,
            )][0];
            if (!loop) {
              throw new CatalogConflictError(
                `Restore revision references unknown loop ${revision.slug}.`,
                "restore_revision_conflict",
              );
            }
            this.sql.exec(
              `INSERT INTO loop_revisions (
                 id, slug, action, status, actor, document_json, created_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              revision.id,
              revision.slug,
              revision.action,
              revision.status,
              revision.actor,
              documentJson,
              revision.createdAt,
            );
          }
          const total = previousCount + body.revisions.length;
          const now = new Date().toISOString();
          for (const [key, value] of [
            ["restore_stream_digest", nextDigest],
            ["restore_last_revision_id", String(lastId)],
            ["restore_uploaded_count", String(total)],
          ]) {
            this.sql.exec(
              `UPDATE catalog_settings SET value = ?, updated_at = ? WHERE key = ?`,
              value,
              now,
              key,
            );
          }
          return { accepted: body.revisions.length, total };
        });
        return jsonResponse(result);
      } catch (error) {
        if (error instanceof CatalogConflictError) {
          return jsonResponse({ error: error.message, code: error.code }, 409);
        }
        throw error;
      }
    }

    if (request.method === "POST" && url.pathname === "/restore/finalize") {
      const body = await request.json();
      try {
        const result = this.state.storage.transactionSync(() => {
          const completed = new Map(
            [...this.sql.exec(
              `SELECT key, value FROM catalog_settings
               WHERE key LIKE 'restore_completed_%'`,
            )].map((row) => [row.key, row.value]),
          );
          if (completed.get("restore_completed_id") === body.restoreId) {
            return {
              restored: Number(completed.get("restore_completed_loops")),
              revisions: Number(completed.get("restore_completed_revisions")),
              active: completed.get("restore_completed_active") === "1",
              completed: true,
            };
          }
          const settings = new Map(
            [...this.sql.exec(
              `SELECT key, value FROM catalog_settings WHERE key LIKE 'restore_%'`,
            )].map((row) => [row.key, row.value]),
          );
          if (settings.get("restore_id") !== body.restoreId) {
            throw new CatalogConflictError(
              "Restore session does not match the active restore.",
              "restore_session_mismatch",
            );
          }
          const revisionMetadata = [...this.sql.exec(
            `SELECT COUNT(*) AS count, MAX(id) AS max_id FROM loop_revisions`,
          )][0];
          if (
            revisionMetadata.count !== Number(settings.get("restore_revision_count")) ||
            (revisionMetadata.max_id || 0) !== Number(settings.get("restore_max_revision_id")) ||
            settings.get("restore_stream_digest") !== settings.get("restore_revision_digest")
          ) {
            throw new CatalogConflictError(
              "Restore revision upload is incomplete or failed its digest check.",
              "restore_incomplete",
            );
          }
          for (const row of this.sql.exec(
            `SELECT slug, status, document_json FROM loops`,
          )) {
            const latest = [...this.sql.exec(
              `SELECT status, document_json FROM loop_revisions
               WHERE slug = ? ORDER BY id DESC LIMIT 1`,
              row.slug,
            )][0];
            if (
              !latest ||
              latest.status !== row.status ||
              latest.document_json !== row.document_json
            ) {
              throw new CatalogConflictError(
                `Restore loop ${row.slug} does not match its latest revision.`,
                "restore_current_mismatch",
              );
            }
            const timestamps = [...this.sql.exec(
              `SELECT MIN(created_at) AS created_at, MAX(created_at) AS updated_at
               FROM loop_revisions WHERE slug = ?`,
              row.slug,
            )][0];
            this.sql.exec(
              `UPDATE loops SET created_at = ?, updated_at = ? WHERE slug = ?`,
              timestamps.created_at,
              timestamps.updated_at,
              row.slug,
            );
          }
          this.assertCatalogIntegrity([]);
          const active = settings.get("restore_active") === "1";
          if (active) {
            this.sql.exec(
              `INSERT INTO catalog_settings (key, value, updated_at)
               VALUES ('public_catalog_active', '1', ?)`,
              settings.get("restore_activated_at") || settings.get("restore_exported_at"),
            );
          }
          const restored = [...this.sql.exec(
            `SELECT COUNT(*) AS count FROM loops`,
          )][0].count;
          this.sql.exec(`DELETE FROM catalog_settings WHERE key LIKE 'restore_%'`);
          const completedSettings = {
            restore_completed_id: body.restoreId,
            restore_completed_loops: String(restored),
            restore_completed_revisions: String(revisionMetadata.count),
            restore_completed_active: active ? "1" : "0",
          };
          for (const [key, value] of Object.entries(completedSettings)) {
            this.sql.exec(
              `INSERT INTO catalog_settings (key, value, updated_at)
               VALUES (?, ?, ?)`,
              key,
              value,
              new Date().toISOString(),
            );
          }
          return { restored, revisions: revisionMetadata.count, active };
        });
        return jsonResponse(result);
      } catch (error) {
        if (error instanceof CatalogConflictError) {
          return jsonResponse({ error: error.message, code: error.code }, 409);
        }
        throw error;
      }
    }

    const loopMatch = url.pathname.match(/^\/loops\/([a-z0-9-]+)$/);

    if (request.method === "GET" && loopMatch) {
      const loop = this.get(loopMatch[1]);
      return loop ? jsonResponse({ loop }) : jsonResponse({ error: "Not found" }, 404);
    }

    if (request.method === "PUT" && loopMatch) {
      const body = await request.json();
      try {
        const result = this.upsert(
          body.loop,
          body.status,
          body.actor,
          body.action,
          body.expectedRevision,
        );
        return jsonResponse(result, result.created ? 201 : 200);
      } catch (error) {
        if (error instanceof CatalogConflictError) {
          return jsonResponse(
            { error: error.message, code: error.code },
            409,
          );
        }
        throw error;
      }
    }

    if (request.method === "POST" && url.pathname === "/import") {
      const body = await request.json();
      try {
        const results = this.state.storage.transactionSync(() => {
          if (body.activate) {
            const activation = [...this.sql.exec(
              `SELECT value FROM catalog_settings
               WHERE key = 'public_catalog_active' LIMIT 1`,
            )][0];
            if (activation?.value === "1") {
              throw new CatalogConflictError(
                "The public catalog is already active.",
                "catalog_already_active",
              );
            }
            assertActivationCatalog(this.list("published"), body.loops);
          }
          this.assertCatalogIntegrity(
            body.loops.map((loop) => ({ loop, status: body.status })),
          );
          const imported = body.loops.map((loop) =>
            this.upsert(loop, body.status, body.actor, "import", null, false, false),
          );
          if (body.activate) {
            const now = new Date().toISOString();
            this.sql.exec(
              `INSERT INTO catalog_settings (key, value, updated_at)
               VALUES ('public_catalog_active', '1', ?)
               ON CONFLICT(key) DO UPDATE SET
                 value = excluded.value,
                 updated_at = excluded.updated_at`,
              now,
            );
          }
          return imported;
        });
        return jsonResponse({ imported: results.length, results });
      } catch (error) {
        if (error instanceof CatalogConflictError) {
          return jsonResponse(
            { error: error.message, code: error.code },
            409,
          );
        }
        throw error;
      }
    }

    const revisionMatch = url.pathname.match(/^\/revisions\/([a-z0-9-]+)$/);

    if (request.method === "GET" && revisionMatch) {
      const revisions = [...this.sql.exec(
        `SELECT id, slug, action, status, actor, document_json, created_at
         FROM loop_revisions WHERE slug = ? ORDER BY id DESC LIMIT 100`,
        revisionMatch[1],
      )].map((row) => ({
        id: row.id,
        slug: row.slug,
        action: row.action,
        status: row.status,
        actor: row.actor,
        loop: JSON.parse(row.document_json),
        createdAt: row.created_at,
      }));
      return jsonResponse({ revisions });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  list(status) {
    const query = status
      ? `SELECT document_json FROM loops WHERE status = ? ORDER BY number ASC`
      : `SELECT document_json, status FROM loops ORDER BY number ASC`;
    const rows = status ? this.sql.exec(query, status) : this.sql.exec(query);

    return [...rows].map((row) => {
      const loop = JSON.parse(row.document_json);
      return status ? loop : { ...loop, status: row.status };
    });
  }

  get(slug) {
    const rows = [...this.sql.exec(
      `SELECT loops.document_json, loops.status,
              (SELECT MAX(id) FROM loop_revisions WHERE loop_revisions.slug = loops.slug) AS revision
       FROM loops WHERE loops.slug = ? LIMIT 1`,
      slug,
    )];

    if (!rows[0]) {
      return null;
    }

    return {
      ...JSON.parse(rows[0].document_json),
      status: rows[0].status,
      revision: rows[0].revision,
    };
  }

  upsert(
    loop,
    status,
    actor,
    action = status,
    expectedRevision,
    useTransaction = true,
    validate = true,
  ) {
    const write = () => {
      if (validate) {
        this.assertCatalogIntegrity([{ loop, status }]);
      }
      const prior = [...this.sql.exec(
        `SELECT loops.slug,
                (SELECT MAX(id) FROM loop_revisions WHERE loop_revisions.slug = loops.slug) AS revision
         FROM loops WHERE loops.slug = ? LIMIT 1`,
        loop.slug,
      )][0];
      if (validate) {
        const currentRevision = prior?.revision || 0;
        if (expectedRevision !== currentRevision) {
          throw new CatalogConflictError(
            `Loop ${loop.slug} changed since it was read. Expected revision ${expectedRevision}; current revision is ${currentRevision}.`,
            "revision_conflict",
          );
        }
      }
      const now = new Date().toISOString();
      const documentJson = JSON.stringify(loop);

      this.sql.exec(
        `INSERT INTO loops (
           slug, number, title, status, published_date, modified_date,
           document_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           number = excluded.number,
           title = excluded.title,
           status = excluded.status,
           published_date = excluded.published_date,
           modified_date = excluded.modified_date,
           document_json = excluded.document_json,
           updated_at = excluded.updated_at`,
        loop.slug,
        loop.number,
        loop.title,
        status,
        loop.published,
        loop.modified,
        documentJson,
        now,
        now,
      );
      this.sql.exec(
        `INSERT INTO loop_revisions (
           slug, action, status, actor, document_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        loop.slug,
        action,
        status,
        actor,
        documentJson,
        now,
      );

      const revision = [...this.sql.exec(
        `SELECT MAX(id) AS revision FROM loop_revisions WHERE slug = ?`,
        loop.slug,
      )][0].revision;
      return { created: !prior, revision, loop: { ...loop, status } };
    };

    return useTransaction ? this.state.storage.transactionSync(write) : write();
  }

  assertCatalogIntegrity(changes) {
    assertCatalogIntegrity(this.list(), changes);
  }
}

function withoutStatus(loop) {
  const { status: _status, ...document } = loop;
  return document;
}

async function chainRevisionDigest(previousDigest, revisions) {
  const chunk = revisions
    .map((revision) => `${JSON.stringify({ type: "revision", revision })}\n`)
    .join("");
  const bytes = new TextEncoder().encode(`${previousDigest}\n${chunk}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function assertCatalogIntegrity(existing, changes) {
  const records = new Map(
    existing.map((loop) => [
      loop.slug,
      { loop: withoutStatus(loop), status: loop.status },
    ]),
  );

  for (const change of changes) {
    records.set(change.loop.slug, change);
  }

  const numberOwner = new Map();

  for (const { loop } of records.values()) {
    const owner = numberOwner.get(loop.number);
    if (owner && owner !== loop.slug) {
      throw new CatalogConflictError(
        `Loop number ${loop.number} is already used by ${owner}.`,
      );
    }
    numberOwner.set(loop.number, loop.slug);
  }

  for (const field of ["title", "seoTitle", "description", "prompt"]) {
    const ownerByValue = new Map();

    for (const { loop, status } of records.values()) {
      if (status !== "published") continue;
      const value = loop[field].trim().toLowerCase();
      const owner = ownerByValue.get(value);
      if (owner && owner !== loop.slug) {
        throw new CatalogConflictError(
          `${loop.slug}.${field} duplicates ${owner}.${field}.`,
        );
      }
      ownerByValue.set(value, loop.slug);
    }
  }

  for (const { loop, status } of records.values()) {
    if (status !== "published") continue;

    for (const relatedSlug of loop.related) {
      const related = records.get(relatedSlug);
      if (!related || related.status !== "published") {
        throw new CatalogConflictError(
          `${loop.slug} references unavailable related loop ${relatedSlug}.`,
        );
      }
    }
  }
}

export function assertActivationCatalog(existingPublished, imported) {
  const importedSlugs = new Set(imported.map((loop) => loop.slug));
  const extra = existingPublished.find(
    (loop) => !importedSlugs.has(loop.slug),
  );

  if (extra) {
    throw new CatalogConflictError(
      `Activation import does not include existing published loop ${extra.slug}.`,
    );
  }
}
