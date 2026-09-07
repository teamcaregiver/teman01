import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArticleForm } from "@/components/article-form";
import { EMPTY_ARTICLE_FORM, articleRowFrom } from "@/lib/articles";
import type { ArticleFormValues } from "@/lib/articles";
import { supabase } from "@/lib/supabase/client";
import { useInvalidate, qk } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/artikel/baru")({
  component: NewArticle,
});

function NewArticle() {
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const backToList = () => navigate({ to: "/admin/artikel" });

  const handleSubmit = async (values: ArticleFormValues) => {
    const { data, error } = await supabase
      .from("articles")
      .insert(articleRowFrom(values))
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    invalidate(qk.articles);
    toast.success("Artikel berjaya ditambah");
    navigate({ to: "/admin/artikel/$articleId", params: { articleId: data.id } });
  };

  return (
    <ArticleForm
      initial={EMPTY_ARTICLE_FORM}
      heading="Artikel Baru"
      description="Cipta kandungan bacaan baharu untuk anak."
      submitLabel="Simpan Artikel"
      backLabel="Kembali ke senarai"
      onSubmit={handleSubmit}
      onLeave={backToList}
    />
  );
}
