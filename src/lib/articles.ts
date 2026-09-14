import type { Article, ContentVisibility } from "@/lib/mock-data";

/** Field set shared by the Artikel create and edit forms. */
export interface ArticleFormValues {
  title: string;
  topicId: string;
  subtopicId: string;
  coverImage: string;
  body: string;
  pdfUrl: string;
  pdfName: string;
  youtubeUrl: string;
  visibility: ContentVisibility;
}

export const EMPTY_ARTICLE_FORM: ArticleFormValues = {
  title: "",
  topicId: "",
  subtopicId: "",
  coverImage: "",
  body: "",
  pdfUrl: "",
  pdfName: "",
  youtubeUrl: "",
  visibility: "published",
};

/** Fallback cover used when the admin leaves the image field empty. */
export const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80";

/** Form values -> the snake_case row shape written to `articles`. */
export function articleRowFrom(form: ArticleFormValues) {
  return {
    title: form.title.trim(),
    topic_id: form.topicId || null,
    subtopic_id: form.subtopicId || null,
    cover_image: form.coverImage.trim() || DEFAULT_COVER_IMAGE,
    body: form.body,
    pdf_url: form.pdfUrl || null,
    pdf_name: form.pdfUrl ? form.pdfName || "lampiran.pdf" : null,
    youtube_url: form.youtubeUrl.trim() || null,
    visibility: form.visibility,
  };
}

/** Existing article -> the form values that prefill the edit page. */
export function articleFormFrom(a: Article): ArticleFormValues {
  return {
    title: a.title,
    topicId: a.topicId ?? "",
    subtopicId: a.subtopicId ?? "",
    coverImage: a.coverImage,
    body: a.body,
    pdfUrl: a.pdfUrl ?? "",
    pdfName: a.pdfName ?? "",
    youtubeUrl: a.youtubeUrl ?? "",
    visibility: a.visibility ?? "published",
  };
}
