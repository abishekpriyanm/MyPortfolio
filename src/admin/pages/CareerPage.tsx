import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { useDraft } from "@/admin/features/content/DraftProvider";
import type { CareerEntry } from "@/features/portfolio-content/schema";

const emptyCareer = (): CareerEntry => ({
  id: `career-${crypto.randomUUID()}`,
  position: "New role",
  company: "Company",
  period: "2026 - Present",
  location: "",
  description: "Add a concise description.",
  responsibilities: [],
  technologies: [],
  visible: false,
  order: 0,
});

export const CareerPage = () => {
  const { content, setContent } = useDraft();
  const replace = (index: number, next: CareerEntry) => setContent((current) => ({ ...current, career: current.career.map((item, itemIndex) => itemIndex === index ? next : item) }));
  const move = (index: number, direction: -1 | 1) => setContent((current) => {
    const next = [...current.career];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, career: next.map((item, order) => ({ ...item, order })) };
  });
  const remove = (index: number) => setContent((current) => ({ ...current, career: current.career.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order })) }));

  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Career timeline</h1><p className="mt-2 text-muted-foreground">Order, hide, or update experience without touching source code.</p></div><Button onClick={() => setContent((current) => ({ ...current, career: [...current.career, { ...emptyCareer(), order: current.career.length }] }))}><Plus className="size-4" />Add entry</Button></div>
    {content.career.map((entry, index) => {
      const update = <K extends keyof CareerEntry>(field: K, value: CareerEntry[K]) => replace(index, { ...entry, [field]: value });
      return <Card key={entry.id}><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg">{entry.position} · {entry.company}</CardTitle><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Move down" disabled={index === content.career.length - 1} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Delete entry" onClick={() => remove(index)}><Trash2 className="size-4 text-destructive" /></Button></div></CardHeader><CardContent className="grid gap-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={entry.visible} onChange={(event) => update("visible", event.target.checked)} />Visible on portfolio</label>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Position</Label><Input value={entry.position} onChange={(event) => update("position", event.target.value)} /></div><div className="space-y-2"><Label>Company</Label><Input value={entry.company} onChange={(event) => update("company", event.target.value)} /></div><div className="space-y-2"><Label>Period</Label><Input value={entry.period} onChange={(event) => update("period", event.target.value)} /></div><div className="space-y-2"><Label>Location</Label><Input value={entry.location} onChange={(event) => update("location", event.target.value)} /></div></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={entry.description} onChange={(event) => update("description", event.target.value)} /></div>
        <div className="space-y-2"><Label>Responsibilities (one per line)</Label><Textarea rows={5} value={entry.responsibilities.join("\n")} onChange={(event) => update("responsibilities", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></div>
        <div className="space-y-2"><Label>Technologies (comma separated)</Label><Input value={entry.technologies.join(", ")} onChange={(event) => update("technologies", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></div>
      </CardContent></Card>;
    })}
  </div>;
};
