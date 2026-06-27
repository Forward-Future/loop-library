const CATEGORY_LABELS = {
  engineering: "Engineering",
  evaluation: "Evaluation",
  operations: "Operations",
  content: "Content",
  design: "Design",
};

const REQUIRED_STRINGS = {
  number: 3,
  slug: 80,
  title: 120,
  summary: 240,
  seoTitle: 160,
  description: 320,
  categoryLabel: 120,
  author: 120,
  published: 10,
  modified: 10,
  prompt: 5000,
  verifyTitle: 240,
  verifyDetail: 1000,
  useWhen: 1200,
  why: 1600,
  note: 1600,
};

export class LoopValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "LoopValidationError";
  }
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category];
}

export function normalizeLoopDocument(input) {
  if (!isPlainObject(input)) {
    throw new LoopValidationError("Loop data must be a JSON object.");
  }

  const loop = {};

  for (const [field, maxLength] of Object.entries(REQUIRED_STRINGS)) {
    loop[field] = requiredString(input[field], field, maxLength);
  }

  if (!/^\d{3}$/.test(loop.number)) {
    throw new LoopValidationError("number must contain exactly three digits.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(loop.slug)) {
    throw new LoopValidationError("slug must use lowercase words separated by hyphens.");
  }

  validateDate(loop.published, "published");
  validateDate(loop.modified, "modified");

  if (loop.modified < loop.published) {
    throw new LoopValidationError("modified cannot be earlier than published.");
  }

  loop.category = requiredString(input.category, "category", 40);
  loop.featured = input.featured === true;

  if (!CATEGORY_LABELS[loop.category]) {
    throw new LoopValidationError(
      `category must be one of: ${Object.keys(CATEGORY_LABELS).join(", ")}.`,
    );
  }

  loop.steps = stringArray(input.steps, "steps", { min: 3, max: 12, itemMax: 1200 });
  loop.keywords = stringArray(input.keywords, "keywords", { min: 3, max: 20, itemMax: 100 });
  loop.related = stringArray(input.related, "related", { min: 1, max: 8, itemMax: 80 });

  if (
    new Set(loop.keywords.map((keyword) => keyword.toLowerCase())).size !==
    loop.keywords.length
  ) {
    throw new LoopValidationError("keywords must be unique.");
  }

  if (new Set(loop.related).size !== loop.related.length) {
    throw new LoopValidationError("related must not contain duplicates.");
  }

  for (const slug of loop.related) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === loop.slug) {
      throw new LoopValidationError("related must contain other valid loop slugs.");
    }
  }

  const sourceUrl = optionalString(input.sourceUrl, "sourceUrl", 500);

  if (sourceUrl) {
    let parsed;

    try {
      parsed = new URL(sourceUrl);
    } catch {
      throw new LoopValidationError("sourceUrl must be a valid URL.");
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new LoopValidationError("sourceUrl must use http or https.");
    }

    loop.sourceUrl = sourceUrl;
  }

  const socialImageUrl = optionalString(
    input.socialImageUrl,
    "socialImageUrl",
    500,
  );

  if (socialImageUrl) {
    let parsed;

    try {
      parsed = new URL(socialImageUrl);
    } catch {
      throw new LoopValidationError("socialImageUrl must be a valid URL.");
    }

    if (parsed.protocol !== "https:") {
      throw new LoopValidationError("socialImageUrl must use https.");
    }

    loop.socialImageUrl = socialImageUrl;
  }

  const searchText = optionalString(input.searchText, "searchText", 3000);

  if (searchText) {
    loop.searchText = searchText;
  }

  if (input.contributorPlaybook !== undefined) {
    if (!isPlainObject(input.contributorPlaybook)) {
      throw new LoopValidationError("contributorPlaybook must be an object.");
    }

    loop.contributorPlaybook = {};

    for (const field of [
      "whenNotToUse",
      "expectedOutputs",
      "implementationGuidance",
      "reviewerHandoff",
    ]) {
      loop.contributorPlaybook[field] = stringArray(
        input.contributorPlaybook[field],
        `contributorPlaybook.${field}`,
        { min: 1, max: 12, itemMax: 1200 },
      );
    }
  }

  const encoded = JSON.stringify(loop);

  if (new TextEncoder().encode(encoded).byteLength > 64 * 1024) {
    throw new LoopValidationError("Loop data must be smaller than 64 KiB.");
  }

  return loop;
}

function requiredString(value, field, maxLength) {
  if (typeof value !== "string") {
    throw new LoopValidationError(`${field} is required.`);
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    throw new LoopValidationError(`${field} must be between 1 and ${maxLength} characters.`);
  }

  return normalized;
}

function optionalString(value, field, maxLength) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new LoopValidationError(`${field} must be a string.`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new LoopValidationError(`${field} must be no longer than ${maxLength} characters.`);
  }

  return normalized || undefined;
}

function stringArray(value, field, { min, max, itemMax }) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new LoopValidationError(`${field} must contain between ${min} and ${max} items.`);
  }

  return value.map((item, index) => requiredString(item, `${field}[${index}]`, itemMax));
}

function validateDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new LoopValidationError(`${field} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new LoopValidationError(`${field} must be a real calendar date.`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
