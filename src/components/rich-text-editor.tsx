import { useEffect, useRef } from "react";
import type Quill from "quill";
import "quill/dist/quill.snow.css";
import { fromEditorHtml, toEditorHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

// No images or video: content stays text, and pictures go in the cover / PDF.
const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "blockquote"],
  ["clean"],
];

/**
 * Quill editor for Buku 1, 2 and 3 content. `value` is HTML (older plain
 * text is converted when loaded); `onChange` receives the HTML to save, or ""
 * when the editor is empty. Quill needs `document` as soon as it is imported,
 * so it is loaded in the browser only.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  // The HTML the editor last showed or sent out. A `value` that differs came
  // from outside (a record finished loading, a reset) and replaces the text.
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    // Ctrl/⌘ shortcuts typed in the editor (B = bold) stay in the editor: the
    // sidebar toggles on Ctrl/⌘+B anywhere in the window (ui/sidebar.tsx).
    const keepShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) e.stopPropagation();
    };
    host.addEventListener("keydown", keepShortcuts);
    void import("quill").then(({ default: QuillEditor }) => {
      if (cancelled) return;
      // Quill puts its toolbar before the element it is given, so that
      // element gets its own wrapper inside the host.
      const el = document.createElement("div");
      host.appendChild(el);
      const q = new QuillEditor(el, {
        theme: "snow",
        placeholder,
        modules: { toolbar: TOOLBAR },
      });
      if (ariaLabel) q.root.setAttribute("aria-label", ariaLabel);
      q.setContents(
        q.clipboard.convert({ html: toEditorHtml(valueRef.current) }),
        "silent",
      );
      shownRef.current = valueRef.current;
      q.on("text-change", () => {
        const html = fromEditorHtml(q.getSemanticHTML());
        shownRef.current = html;
        onChangeRef.current(html);
      });
      quillRef.current = q;
    });
    return () => {
      cancelled = true;
      quillRef.current = null;
      host.removeEventListener("keydown", keepShortcuts);
      host.replaceChildren();
    };
    // Toolbar and placeholder are fixed for the editor's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    if (!q || value === shownRef.current) return;
    q.setContents(q.clipboard.convert({ html: toEditorHtml(value) }), "silent");
    shownRef.current = value;
  }, [value]);

  return <div ref={hostRef} className={cn("editor-kaya", className)} />;
}
