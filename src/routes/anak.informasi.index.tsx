import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { articles, videos, TOPICS, SUBTOPICS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Download, FileText, Search, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerItem, StaggerList } from "@/components/page-transition";

export const Route = createFileRoute("/anak/informasi/")({
  component: InfoLibrary,
});

function InfoLibrary() {
  const [topic, setTopic] = useState<string>("Semua");
  const [sub, setSub] = useState<string>("Semua");
  const [q, setQ] = useState("");

  const subOptions = topic === "Semua" ? [] : (SUBTOPICS[topic] ?? []);

  const filteredArticles = articles.filter(
    (a) =>
      (topic === "Semua" || a.topic === topic) &&
      (sub === "Semua" || a.subtopic === sub) &&
      a.title.toLowerCase().includes(q.toLowerCase()),
  );
  const filteredVideos = videos.filter(
    (v) =>
      (topic === "Semua" || v.topic === topic) &&
      (sub === "Semua" || v.subtopic === sub) &&
      v.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold">Manual Caregiver</h1>
        <p className="text-sm text-muted-foreground">
          Panduan & manual penjagaan warga emas untuk caregiver.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari tajuk..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {["Semua", ...TOPICS].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTopic(t);
                setSub("Semua");
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${topic === t ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {subOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5"
            >
              {["Semua", ...subOptions].map((s) => (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] transition-all ${sub === s ? "bg-teal text-teal-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Tabs defaultValue="artikel">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="artikel">
            Manual 1 ({filteredArticles.length})
          </TabsTrigger>
          <TabsTrigger value="video">
            Manual 2 ({filteredVideos.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="artikel" className="mt-3">
          <StaggerList>
            <div className="space-y-3">
              {filteredArticles.map((a) => (
                <StaggerItem key={a.id}>
                  <Link to="/anak/informasi/$id" params={{ id: a.id }}>
                    <Card className="hover-lift overflow-hidden border-border/60 p-0">
                      <div className="flex gap-3">
                        <div className="h-24 w-28 shrink-0 overflow-hidden bg-muted">
                          <img
                            src={a.coverImage}
                            alt={a.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 p-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant="secondary"
                              className="bg-sage/20 text-sage-foreground text-[10px]"
                            >
                              {a.topic}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm font-display font-semibold">
                            {a.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {a.body}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              ))}
            </div>
          </StaggerList>
        </TabsContent>
        <TabsContent value="video" className="mt-3">
          <div className="space-y-3">
            {filteredVideos.map((v) => (
              <Card key={v.id} className="overflow-hidden border-border/60 p-0">
                <div className="aspect-video bg-black">
                  <iframe
                    src={v.url}
                    className="h-full w-full"
                    allowFullScreen
                    title={v.title}
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge
                      variant="secondary"
                      className="bg-lavender/30 text-lavender-foreground text-[10px]"
                    >
                      {v.topic}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-display font-semibold">
                    {v.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {v.description}
                  </p>

                  {/* Bahan sokongan PDF — dipaparkan sama seperti artikel. */}
                  {v.pdfUrl && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <FileText className="h-3.5 w-3.5 text-primary" />{" "}
                          Bahan Sokongan PDF
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={v.pdfUrl} download={v.pdfName ?? true}>
                            <Download className="mr-1 h-3.5 w-3.5" /> Muat Turun
                          </a>
                        </Button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border/60">
                        <iframe
                          src={v.pdfUrl}
                          title={`PDF: ${v.title}`}
                          className="h-[60vh] w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
