import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleForm } from "@/components/article-form";
import { articleFormFrom, articleRowFrom } from "@/lib/articles";
import type { ArticleFormValues } from "@/lib/articles";
import { fetchArticleById } from "@/lib/db";
import { supabase } from "@/lib/supabase/client";
import { useInvalidate, qk } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/artikel/$articleId/edit")({
  component: EditArticle,
});

function EditArticle() {
  const { articleId } = useParams({ from: "/admin/artikel/$articleId/edit" });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const qc = useQueryClient();

  const articleQ = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => fetchArticleById(articleId),
  });
  const article = articleQ.data ?? null;

  // Stable object identity so ArticleForm only re-seeds when the article changes.
  const initial = useMemo(
    () => (article ? articleFormFrom(article) : null),
    [article],
  );

  const backToDetail = () =>
    navigate({ to: "/admin/artikel/$articleId", params: { articleId } });

  const handleSubmit = async (values: ArticleFormValues) => {
    const { error } = await supabase
      .from("articles")
      .update(articleRowFrom(values))
      .eq("id", articleId);
    if (error) throw new Error(error.message);
    invalidate(qk.articles);
    await qc.invalidateQueries({ queryKey: ["article", articleId] });
    toast.success("Artikel berjaya dikemaskini");
    backToDetail();
  };

  if (articleQ.isPending) return <EditSkeleton />;

  if (articleQ.isError)
    return (
      <StatusPanel
        title="Gagal memuatkan artikel"
        hint={(articleQ.error as Error).message}
        action={
          <Button variant="outline" size="sm" onClick={() => void articleQ.refetch()}>
            Cuba lagi
          </Button>
        }
      />
    );

  if (!article || !initial)
    return (
      <StatusPanel
        title="Artikel tidak dijumpai"
        hint="Artikel ini mungkin telah dipadam atau pautan tidak sah."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/artikel">Kembali ke senarai</Link>
          </Button>
        }
      />
    );

  return (
    <ArticleForm
      initial={initial}
      heading="Kemaskini Artikel"
      description={article.title}
      submitLabel="Simpan Perubahan"
      backLabel="Kembali ke artikel"
      onSubmit={handleSubmit}
      onLeave={backToDetail}
    />
  );
}

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function StatusPanel({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-3xl border-border/60 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
