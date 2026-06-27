import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { articles, youtubeEmbed } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, FileText } from "lucide-react";

export const Route = createFileRoute("/anak/informasi/$id")({
  component: ArticleDetail,
});

function ArticleDetail() {
  const { id } = useParams({ from: "/anak/informasi/$id" });
  const a = articles.find((x) => x.id === id);
  if (!a) return <p>Manual tidak dijumpai.</p>;
  return (
    <div className="space-y-4">
      <Link
        to="/anak/informasi"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>
      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <img
          src={a.coverImage}
          alt={a.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="bg-teal/25 text-teal-foreground">
          {a.topic}
        </Badge>
        <Badge variant="outline">{a.subtopic}</Badge>
      </div>
      <h1 className="font-display text-2xl font-bold leading-tight">
        {a.title}
      </h1>
      {a.body && (
        <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/90">
          {a.body}
        </div>
      )}

      {/* PDF shown as the main readable content, with download as a secondary action. */}
      {a.pdfUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" /> Dokumen PDF
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={a.pdfUrl} download={a.pdfName ?? true}>
                <Download className="mr-1 h-3.5 w-3.5" /> Muat Turun
              </a>
            </Button>
          </div>
          <Card className="overflow-hidden border-border/60 p-0">
            <iframe
              src={a.pdfUrl}
              title={`PDF: ${a.title}`}
              className="h-[75vh] w-full"
            />
          </Card>
        </div>
      )}

      {/* Optional supporting YouTube video. */}
      {a.youtubeUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Video Berkaitan</p>
          <Card className="overflow-hidden border-border/60 p-0">
            <div className="aspect-video w-full bg-black">
              <iframe
                src={youtubeEmbed(a.youtubeUrl)}
                className="h-full w-full"
                allowFullScreen
                title={`Video: ${a.title}`}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
