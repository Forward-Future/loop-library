export function escapeJsonForHtmlScript(value) {
  return String(value).replace(/<\/script/gi, (match) =>
    match.replace("/", "\\/"),
  );
}
