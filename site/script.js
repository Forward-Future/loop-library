const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_STORAGE_KEY = "loop-library-theme";

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
  }

  if (themeColor) {
    themeColor.setAttribute("content", isDark ? "#101010" : "#faf8f7");
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies for this page view.
    }
  }
}

applyTheme(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

themeMedia.addEventListener("change", (event) => {
  if (!readStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

const searchInput = document.querySelector("#loop-search");
const loopRows = [...document.querySelectorAll(".loop-row")];
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");

let toastTimer;

function normalize(value) {
  return value.toLowerCase().trim();
}

function updateLibrary() {
  if (!searchInput || !resultsCount || !emptyState) {
    return;
  }

  const query = normalize(searchInput.value);
  let visibleCount = 0;

  loopRows.forEach((row) => {
    const searchableText = `${row.dataset.search} ${row.textContent}`;
    const matchesSearch =
      query.length === 0 || normalize(searchableText).includes(query);

    row.hidden = !matchesSearch;
    if (matchesSearch) {
      visibleCount += 1;
    }
  });

  resultsCount.textContent = `Showing ${visibleCount} ${
    visibleCount === 1 ? "loop" : "loops"
  }`;
  emptyState.hidden = visibleCount !== 0;
}

if (searchInput) {
  searchInput.addEventListener("input", updateLibrary);
  searchInput.addEventListener("search", updateLibrary);
}

updateLibrary();

function showToast(message) {
  if (!toast) {
    return;
  }

  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the selection-based copy path.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("Copy is unavailable.");
  }
}

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const copyRoot = button.closest("[data-copy-root]");
    const prompt = copyRoot?.querySelector("[data-prompt]")?.textContent.trim();
    const label = button.querySelector("span");

    if (!prompt || !label) {
      return;
    }

    try {
      await copyText(prompt.replace(/\s+/g, " "));
      label.textContent = "Copied";
      showToast("Loop copied to clipboard.");
      window.setTimeout(() => {
        label.textContent = "Copy";
      }, 1800);
    } catch {
      showToast("Copy failed. Select the prompt text instead.");
    }
  });
});

const form = document.querySelector("#loop-form");
const formStatus = document.querySelector("#form-status");
const submitButton = form?.querySelector(".submit-button");
const submitButtonLabel = submitButton?.querySelector("span");

let formStartedAt = performance.now();
let idempotencyKey = makeIdempotencyKey();

function makeIdempotencyKey() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setFormStatus(message, kind = "") {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.toggle("is-success", kind === "success");
  formStatus.classList.toggle("is-error", kind === "error");
}

function optionalValue(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return value || undefined;
}

async function postSiteData(
  collection,
  payload,
  key,
  rateLimitMessage,
  fallbackMessage,
) {
  const response = await fetch(`./.herenow/data/${collection}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(payload),
  });

  let responseBody = {};
  try {
    responseBody = await response.json();
  } catch {
    responseBody = {};
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(rateLimitMessage);
    }

    throw new Error(
      responseBody.message ||
        responseBody.error ||
        fallbackMessage,
    );
  }
}

if (form && submitButton && submitButtonLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      setFormStatus("Complete the required fields before submitting.", "error");
      return;
    }

    const formData = new FormData(form);
    const honeypot = String(formData.get("company") || "").trim();

    if (honeypot) {
      form.reset();
      setFormStatus("Thanks. Your suggestion is in review.", "success");
      return;
    }

    if (performance.now() - formStartedAt < 1200) {
      setFormStatus(
        "Take a moment to review the loop, then submit it again.",
        "error",
      );
      return;
    }

    const payload = {
      loop_title: String(formData.get("loop_title")).trim(),
      instructions: String(formData.get("instructions")).trim(),
    };

    const name = optionalValue(formData, "name");
    const sourceUrl = optionalValue(formData, "source_url");

    if (name) {
      payload.name = name;
    }

    if (sourceUrl) {
      payload.source_url = sourceUrl;
    }

    submitButton.disabled = true;
    submitButtonLabel.textContent = "Sending";

    try {
      await postSiteData(
        "suggestions",
        payload,
        idempotencyKey,
        "This connection has reached the submission limit. Try again later.",
        "The suggestion could not be submitted.",
      );

      form.reset();
      setFormStatus(
        "Received. The loop is now in the private review queue.",
        "success",
      );
      idempotencyKey = makeIdempotencyKey();
      formStartedAt = performance.now();
    } catch (error) {
      setFormStatus(
        error.message || "Something went wrong. Try again in a moment.",
        "error",
      );
    } finally {
      submitButton.disabled = false;
      submitButtonLabel.textContent = "Submit loop";
    }
  });
}

const weeklyForm = document.querySelector("#weekly-form");
const weeklyStatus = document.querySelector("#weekly-status");
const weeklyButton = weeklyForm?.querySelector(".newsletter-button");
const weeklyButtonLabel = weeklyButton?.querySelector("span");

let weeklyFormStartedAt = performance.now();
let weeklyIdempotencyKey = makeIdempotencyKey();

function setWeeklyStatus(message, kind = "") {
  if (!weeklyStatus) {
    return;
  }

  weeklyStatus.textContent = message;
  weeklyStatus.classList.toggle("is-success", kind === "success");
  weeklyStatus.classList.toggle("is-error", kind === "error");
}

if (weeklyForm && weeklyButton && weeklyButtonLabel) {
  weeklyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setWeeklyStatus("");

    if (!weeklyForm.checkValidity()) {
      weeklyForm.reportValidity();
      setWeeklyStatus("Enter a valid email address.", "error");
      return;
    }

    const formData = new FormData(weeklyForm);
    const honeypot = String(
      formData.get("newsletter_company") || "",
    ).trim();

    if (honeypot) {
      weeklyForm.reset();
      setWeeklyStatus("You’re on the weekly list.", "success");
      return;
    }

    if (performance.now() - weeklyFormStartedAt < 800) {
      setWeeklyStatus("Take a moment, then submit again.", "error");
      return;
    }

    weeklyButton.disabled = true;
    weeklyButtonLabel.textContent = "Adding";

    try {
      await postSiteData(
        "weekly_signups",
        { email: String(formData.get("email")).trim() },
        weeklyIdempotencyKey,
        "This connection has reached the signup limit. Try again later.",
        "The signup could not be submitted.",
      );
      weeklyForm.reset();
      setWeeklyStatus(
        "You’re on the list. Watch your inbox for the best loops.",
        "success",
      );
      weeklyIdempotencyKey = makeIdempotencyKey();
      weeklyFormStartedAt = performance.now();
    } catch (error) {
      setWeeklyStatus(
        error.message || "Something went wrong. Try again in a moment.",
        "error",
      );
    } finally {
      weeklyButton.disabled = false;
      weeklyButtonLabel.textContent = "Notify me weekly";
    }
  });
}
