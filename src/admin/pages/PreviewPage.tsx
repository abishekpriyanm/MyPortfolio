import { Badge } from "@/admin/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { useDraft } from "@/admin/features/content/DraftProvider";

export const PreviewPage = () => {
  const { content } = useDraft();
  const projects = content.projects.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  return <div className="space-y-8">
    <div><Badge>Draft preview</Badge><h1 className="mt-3 text-4xl font-semibold tracking-tight">{content.about.title}</h1><p className="mt-4 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted-foreground">{content.about.description}</p></div>
    <section><h2 className="mb-4 text-xl font-semibold">Career</h2><div className="space-y-3">{content.career.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((entry) => <Card key={entry.id}><CardHeader><CardTitle className="text-base">{entry.position} · {entry.company}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{entry.period} · {entry.location}</p><p className="mt-3">{entry.description}</p></CardContent></Card>)}</div></section>
    <section><h2 className="mb-4 text-xl font-semibold">Projects</h2><div className="grid gap-4 md:grid-cols-2">{projects.map((project) => <Card key={project.id}><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="outline">{project.category}</Badge>{project.featured && <span className="text-xs text-primary">Featured</span>}</div><CardTitle>{project.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{project.summary}</p><div className="mt-4 flex flex-wrap gap-2">{project.technologies.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></CardContent></Card>)}</div></section>
  </div>;
};
