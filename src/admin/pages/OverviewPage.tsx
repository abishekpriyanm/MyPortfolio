import { AlertCircle, Archive, BriefcaseBusiness, CheckCircle2, Workflow } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { useDraft } from "@/admin/features/content/DraftProvider";

export const OverviewPage = () => {
  const draft = useDraft();
  if (draft.loading) return <p className="text-sm text-muted-foreground">Loading draft…</p>;

  return (
    <div className="space-y-8">
      <div><Badge variant="outline">Content operations</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">Publishing overview</h1><p className="mt-2 max-w-2xl text-muted-foreground">Edit one working draft, inspect the checklist, then publish an atomic version to the public portfolio.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>Visible projects</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><BriefcaseBusiness className="size-5 text-primary" />{draft.content.projects.filter((item) => item.visible).length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Career entries</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Workflow className="size-5 text-primary" />{draft.content.career.filter((item) => item.visible).length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Saved versions</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Archive className="size-5 text-primary" />{draft.history.length}</CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Publish checklist</CardTitle><CardDescription>Only visible projects with case studies enabled require complete case-study fields.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {draft.issues.length === 0 ? <div className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="size-4" />Draft is eligible to publish.</div> : draft.issues.map((issue) => <div key={`${issue.path}-${issue.message}`} className="flex gap-2 text-sm text-amber-300"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{issue.message}</span></div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Version history</CardTitle><CardDescription>Restoring archives the current public version and starts a fresh draft.</CardDescription></CardHeader>
        <CardContent className="divide-y divide-border">
          {draft.history.map((version) => <div key={version.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Version {version.version} <Badge className="ml-2" variant="outline">{version.state}</Badge></p><p className="mt-1 text-xs text-muted-foreground">{new Date(version.publishedAt ?? version.createdAt).toLocaleString()}</p></div>{version.state === "archived" && <Button size="sm" variant="outline" disabled={draft.saving} onClick={() => void draft.rollback(version.id)}>Restore</Button>}</div>)}
        </CardContent>
      </Card>
    </div>
  );
};
