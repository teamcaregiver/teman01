// Rich text for Buku 1, 2 and 3 (issue #10). The Quill editor saves HTML;
// content written before the editor existed is plain text, so every helper
// accepts both. HTML is sanitised again when shown (src/components/rich-text.tsx).

const TAG_HTML =
  /<\/?(p|br|h[1-6]|ul|ol|li|strong|b|em|i|u|s|a|blockquote|pre|code|span|div)\b[^>]*>/i;

/** True for editor HTML, false for older plain-text content. */
export function isRichText(content: string | null | undefined): boolean {
  return !!content && TAG_HTML.test(content);
}

export const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Plain text as editor HTML: one paragraph per line, blank lines kept. */
export function textToHtml(text: string): string {
  if (!text.trim()) return "";
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
    .join("");
}

/** Content ready for the editor, whichever format it was saved in. */
export function toEditorHtml(content: string | null | undefined): string {
  if (!content) return "";
  return isRichText(content) ? content : textToHtml(content);
}

const NBSP = String.fromCharCode(160);

/**
 * The editor's HTML, ready to save: "" when nothing was written, and Quill 2's
 * non-breaking spaces (it turns every space into one) made normal again so
 * the text can wrap.
 */
export function fromEditorHtml(html: string): string {
  const clean = html.replaceAll("&nbsp;", " ").replaceAll(NBSP, " ");
  return isBlank(clean) ? "" : clean;
}

const ENTITY: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, e: string) => {
    if (e[0] !== "#") return ENTITY[e.toLowerCase()] ?? match;
    const code =
      e[1] === "x" || e[1] === "X"
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
    return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

/**
 * Content as plain text, for previews, search and "is it empty?" checks.
 * Each paragraph, heading or list item ends up on its own line.
 */
export function plainText(content: string | null | undefined): string {
  if (!content) return "";
  if (!isRichText(content)) return content.trim();
  return decodeEntities(
    content
      .replace(/<br\b[^>]*>/gi, "\n")
      .replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Plain text for a one-line preview in a list: like plainText, but headings
 * are left out so the preview starts with the actual text.
 */
export function previewText(content: string | null | undefined): string {
  if (!content || !isRichText(content)) return plainText(content);
  return plainText(content.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, ""));
}

/** True when the content has no visible text (e.g. Quill's empty "<p><br></p>"). */
export function isBlank(content: string | null | undefined): boolean {
  return plainText(content) === "";
}
