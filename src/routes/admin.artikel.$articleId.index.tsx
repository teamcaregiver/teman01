import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchArticleById } from "@/lib/db";
import { supabase } from "@/lib/supabase/client";
import { useInvalidate, qk } from "@/lib/data";
import {
  VISIBILITY_LABEL,
  YT_IFRAME_ALLOW,
  youtubeEmbed,
  youtubeId,
} from "@/lib/mock-data";
import type { ContentVisibility } from "@/lib/mock-data";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin/artikel/$articleId/")({
  component: ArticleDetail,
});

function ArticleDetail() {
  const { articleId } = useParams({ from: "/admin/artikel/$articleId/" });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const articleQ = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => fetchArticleById(articleId),
  });
  const a = articleQ.data ?? null;

  const handleDelete = async () => {
    if (!a) return;
    setDeleting(true);
    const { error } = await supabase.from("articles").delete().eq("id", a.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    invalidate(qk.articles);
    setConfirmDelete(false);
    toast.success("Artikel dipadam");
    navigate({ to: "/admin/artikel" });
  };

  if (articleQ.isPending) return <DetailSkeleton />;

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

  if (!a)
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

  const ytValid = !!youtubeId(a.youtubeUrl);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/admin/artikel"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke senarai
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight">{a.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {a.topic && (
              <Badge variant="secondary" className="bg-teal/25 text-teal-foreground">
                {a.topic}
              </Badge>
            )}
            {a.subtopic && <Badge variant="outline">{a.subtopic}</Badge>}
            <VisibilityBadge value={a.visibility} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/artikel/$articleId/edit" params={{ articleId }}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Padam
          </Button>
        </div>
      </div>

      {/* Meta strip */}
      <Card className="border-border/60 p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Meta label="Status" value={VISIBILITY_LABEL[a.visibility ?? "published"]} />
          <Meta label="Tarikh" value={format(new Date(a.createdAt), "dd MMM yyyy")} />
          <Meta label="Tontonan" value={(a.views ?? 0).toLocaleString()} />
          <Meta
            label="Lampiran"
            value={
              [a.pdfUrl ? "PDF" : null, a.youtubeUrl ? "Video" : null]
                .filter(Boolean)
                .join(" · ") || "—"
            }
          />
        </dl>
      </Card>

      {/* Cover */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
        <img src={a.coverImage} alt={a.title} className="h-full w-full object-cover" />
      </div>

      {/* Body */}
      {a.body?.trim() ? (
        <Card className="border-border/60 p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kandungan Artikel
          </h2>
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {a.body}
          </div>
        </Card>
      ) : (
        !a.pdfUrl && (
          <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">
            Artikel ini belum mempunyai kandungan teks.
          </Card>
        )
      )}

      {/* PDF */}
      {a.pdfUrl && (
        <Card className="border-border/60 p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Dokumen PDF
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={a.pdfUrl} target="_blank" rel="noreferrer">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Buka tab baru
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={a.pdfUrl} download={a.pdfName ?? true}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Muat Turun
                </a>
              </Button>
            </div>
          </div>
          <p className="mb-2 truncate text-xs text-muted-foreground">
            {a.pdfName || "lampiran.pdf"}
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            <iframe src={a.pdfUrl} title={`PDF: ${a.title}`} className="h-[70vh] w-full" />
          </div>
        </Card>
      )}

      {/* Video */}
      {a.youtubeUrl && (
        <Card className="border-border/60 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <VideoIcon className="h-3.5 w-3.5" /> Video Berkaitan
          </h2>
          {ytValid ? (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <iframe
                src={youtubeEmbed(a.youtubeUrl)}
                className="h-full w-full"
                allow={YT_IFRAME_ALLOW}
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                title={a.title}
              />
            </div>
          ) : (
            <div className="rounded-md bg-muted/40 p-4 text-xs text-muted-foreground">
              Pautan video tidak dikenali sebagai YouTube.{" "}
              <a
                href={a.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Buka pautan asal
              </a>
            </div>
          )}
        </Card>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              "{a.title}" akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Memadam..." : "Ya, Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function VisibilityBadge({ value }: { value?: ContentVisibility }) {
  const v = value ?? "published";
  return v === "published" ? (
    <Badge variant="secondary" className="bg-sage/30 text-sage-foreground">
      {VISIBILITY_LABEL.published}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {VISIBILITY_LABEL.draft}
    </Badge>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <Skeleton className="h-48 rounded-xl" />
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
