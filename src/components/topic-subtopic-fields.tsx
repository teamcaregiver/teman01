import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Plus, X } from "lucide-react";
import { useTaxonomy, addTopic, addSubtopic, TAXONOMY_QK } from "@/lib/taxonomy-store";
import { useInvalidate } from "@/lib/data";
import { toast } from "sonner";

interface Props {
  /** Selected topic id ("" when none). */
  topicId: string;
  /** Selected subtopic id ("" when none). */
  subtopicId: string;
  onTopicChange: (topicId: string) => void;
  onSubtopicChange: (subtopicId: string) => void;
  topicRequired?: boolean;
}

// Topic + Subtopic selectors shared by the Artikel & Video forms, with inline
// "add new" so admin can extend the shared taxonomy without leaving the form.
export function TopicSubtopicFields({
  topicId,
  subtopicId,
  onTopicChange,
  onSubtopicChange,
  topicRequired,
}: Props) {
  const tax = useTaxonomy();
  const invalidate = useInvalidate();
  const [newTopic, setNewTopic] = useState<string | null>(null);
  const [newSub, setNewSub] = useState<string | null>(null);

  const subOptions = topicId ? (tax.subtopics[topicId] ?? []) : [];

  const commitTopic = async () => {
    const name = (newTopic ?? "").trim();
    if (!name) return;
    try {
      const result = await addTopic(name);
      if (!result) return;
      // Select it whether newly created or pre-existing.
      onTopicChange(result.id);
      onSubtopicChange("");
      invalidate(TAXONOMY_QK);
      if (result.created) toast.success(`Topik "${name}" ditambah`);
      setNewTopic(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah topik");
    }
  };

  const commitSub = async () => {
    const name = (newSub ?? "").trim();
    if (!name || !topicId) return;
    try {
      const result = await addSubtopic(topicId, name);
      if (!result) return;
      onSubtopicChange(result.id);
      invalidate(TAXONOMY_QK);
      if (result.created) toast.success(`Subtopik "${name}" ditambah`);
      setNewSub(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah subtopik");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">{topicRequired ? "Topik *" : "Topik"}</Label>
        {newTopic === null ? (
          <Select
            value={topicId}
            onValueChange={(v) => {
              onTopicChange(v);
              onSubtopicChange("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih topik" />
            </SelectTrigger>
            <SelectContent>
              {tax.topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-1">
            <Input
              autoFocus
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTopic();
                }
              }}
              placeholder="Nama topik baru"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={commitTopic}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setNewTopic(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {newTopic === null && (
          <button
            type="button"
            onClick={() => setNewTopic("")}
            className="inline-flex items-center text-[11px] text-primary hover:underline"
          >
            <Plus className="mr-0.5 h-3 w-3" /> Topik baru
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Subtopik</Label>
        {newSub === null ? (
          <Select
            value={subtopicId}
            onValueChange={onSubtopicChange}
            disabled={!topicId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih subtopik" />
            </SelectTrigger>
            <SelectContent>
              {subOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-1">
            <Input
              autoFocus
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitSub();
                }
              }}
              placeholder="Nama subtopik baru"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={commitSub}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setNewSub(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {newSub === null && (
          <button
            type="button"
            disabled={!topicId}
            onClick={() => setNewSub("")}
            className="inline-flex items-center text-[11px] text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <Plus className="mr-0.5 h-3 w-3" /> Subtopik baru
          </button>
        )}
      </div>
    </div>
  );
}
