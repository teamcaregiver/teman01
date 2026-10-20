import { useMemo } from "react";
import DOMPurify from "dompurify";
import { isRichText, plainText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

// Only what the editor's toolbar can produce survives; styles, classes,
// scripts and event handlers are dropped.
const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "span",
];

let linksHooked = false;

function sanitize(html: string): string {
  if (!linksHooked) {
    // Links open in a new tab without access to this window.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    linksHooked = true;
  }
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ["href"] });
}

/**
 * Shows Buku 1 / 2 / 3 content: editor HTML (sanitised) or, for content saved
 * before the editor existed, the plain text with its line breaks.
 */
export function RichText({
  content,
  className,
}: {
  content?: string | null;
  className?: string;
}) {
  const html = useMemo(
    () =>
      content && isRichText(content) && DOMPurify.isSupported
        ? sanitize(content)
        : null,
    [content],
  );
  if (!content) return null;
  if (html === null) {
    return (
      <div className={cn("konten-kaya whitespace-pre-line", className)}>
        {isRichText(content) ? plainText(content) : content}
      </div>
    );
  }
  return (
    <div
      className={cn("konten-kaya", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
