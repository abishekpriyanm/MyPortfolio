import { useId, useMemo, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/admin/components/ui/alert-dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { useDraft } from "@/admin/features/content/DraftProvider";
import { uploadProjectImage } from "@/admin/features/media/mediaRepository";
import type { MediaReference, PortfolioProject } from "@/features/portfolio-content/schema";

const emptyMedia = (title: string): MediaReference => ({ assetId: null, path: "/images/placeholder.webp", alt: `${title} project preview`, caption: "" });
const emptyProject = (): PortfolioProject => {
  const id = `project-${crypto.randomUUID()}`;
  return { id, slug: id, title: "Untitled project", category: "Project", summary: "Add a clear project summary.", technologies: [], featured: false, visible: false, caseStudyEnabled: false, order: 0, cover: emptyMedia("Untitled project"), gallery: [], links: { repository: "", live: "", evidence: "" }, caseStudy: { problem: "", constraints: "", system: "", role: "", engineering: "", outcome: "", status: "", limitations: "" }, seo: { title: "", description: "" } };
};

const TextField = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange(value: string): void; type?: string }) => <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
const LongField = ({ label, value, onChange, placeholder, requiredForPublish = false }: { label: string; value: string; onChange(value: string): void; placeholder?: string; requiredForPublish?: boolean }) => {
  const id = useId();
  return <div className="space-y-2"><Label htmlFor={id}>{label}{requiredForPublish && <><span className="ml-1 text-destructive" aria-hidden="true">*</span><span className="sr-only"> required to publish</span></>}</Label><Textarea id={id} rows={5} value={value} placeholder={placeholder} aria-required={requiredForPublish || undefined} onChange={(event) => onChange(event.target.value)} /></div>;
};

const caseStudyFieldGuidance = {
  problem: { requiredForPublish: true, placeholder: "Example: Manual handoffs caused delayed updates and avoidable delivery errors." },
  constraints: { requiredForPublish: false, placeholder: "Example: Work within the existing stack, budget, and live operational workflow." },
  system: { requiredForPublish: true, placeholder: "Example: Built a role-based workflow covering ordering, operations, and delivery." },
  role: { requiredForPublish: true, placeholder: "Example: Designed the architecture and implemented the core order-to-delivery flow." },
  engineering: { requiredForPublish: true, placeholder: "Example: Added idempotent updates and explicit state transitions to prevent duplicate actions." },
  outcome: { requiredForPublish: true, placeholder: "Example: Centralized operational tracking and reduced repeated manual coordination." },
  status: { requiredForPublish: true, placeholder: "Example: In active use, pilot, prototype, or archived — state only what is verified." },
  limitations: { requiredForPublish: true, placeholder: "Example: Automated load testing and multi-tenant isolation are not yet verified." },
} satisfies Record<keyof PortfolioProject["caseStudy"], { requiredForPublish: boolean; placeholder: string }>;
type ProjectImageKind = "project_cover" | "project_gallery";
type PendingUpload = { projectId: string; file: File; kind: ProjectImageKind; alt: string };

export const ProjectsPage = () => {
  const { content, setContent } = useDraft();
  const [selectedId, setSelectedId] = useState(content.projects[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const selectedIndex = content.projects.findIndex((item) => item.id === selectedId);
  const project = content.projects[selectedIndex] ?? null;

  const replace = (next: PortfolioProject) => setContent((current) => ({ ...current, projects: current.projects.map((item) => item.id === next.id ? next : item) }));
  const move = (index: number, direction: -1 | 1) => setContent((current) => {
    const next = [...current.projects];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, projects: next.map((item, order) => ({ ...item, order })) };
  });
  const add = () => { const next = { ...emptyProject(), order: content.projects.length }; setContent((current) => ({ ...current, projects: [...current.projects, next] })); setSelectedId(next.id); };
  const remove = () => {
    if (!project) return;
    setContent((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id).map((item, order) => ({ ...item, order })) }));
    setSelectedId(content.projects.find((item) => item.id !== project.id)?.id ?? "");
    setDeleteOpen(false);
  };

  const beginUpload = (event: ChangeEvent<HTMLInputElement>, kind: ProjectImageKind) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;
    event.target.value = "";
    setUploadError("");
    setPendingUpload({ projectId: project.id, file, kind, alt: `${project.title} ${kind === "project_cover" ? "cover" : "screenshot"}` });
  };

  const upload = async () => {
    if (!pendingUpload) return;
    setUploading(true); setUploadError("");
    try {
      const media = await uploadProjectImage(pendingUpload.file, pendingUpload.kind, pendingUpload.alt.trim());
      setContent((current) => ({
        ...current,
        projects: current.projects.map((item) => {
          if (item.id !== pendingUpload.projectId) return item;
          return pendingUpload.kind === "project_cover" ? { ...item, cover: media } : { ...item, gallery: [...item.gallery, media] };
        }),
      }));
      setPendingUpload(null);
    } catch (caught) { setUploadError(caught instanceof Error ? caught.message : "Upload failed."); }
    finally { setUploading(false); }
  };

  const duplicateSlugs = useMemo(() => content.projects.filter((item, index) => content.projects.findIndex((candidate) => candidate.slug === item.slug) !== index).map((item) => item.slug), [content.projects]);

  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-muted-foreground">Summary cards, dedicated case studies, cover art, and galleries.</p></div><Button onClick={add}><Plus className="size-4" />New project</Button></div>
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit"><CardHeader><CardTitle className="text-base">Project order</CardTitle></CardHeader><CardContent className="space-y-2">{content.projects.map((item, index) => <div key={item.id} className={`flex items-center gap-1 rounded-md border p-1 ${item.id === selectedId ? "border-primary bg-primary/10" : "border-border"}`}><button className="min-w-0 flex-1 px-2 py-2 text-left" onClick={() => setSelectedId(item.id)}><span className="block truncate text-sm font-medium">{item.title}</span><span className="text-xs text-muted-foreground">/{item.slug}</span></button><Button size="icon" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="size-3" /></Button><Button size="icon" variant="ghost" disabled={index === content.projects.length - 1} onClick={() => move(index, 1)}><ArrowDown className="size-3" /></Button></div>)}</CardContent></Card>
      {project ? <div className="space-y-6">
        <Card><CardHeader><CardTitle>{project.title}</CardTitle><CardDescription>Case studies are optional. When enabled on a visible project, required fields must be complete before publish.</CardDescription></CardHeader><CardContent className="grid gap-5">
          <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={project.visible} onChange={(event) => replace({ ...project, visible: event.target.checked })} />Visible</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={project.featured} onChange={(event) => replace({ ...project, featured: event.target.checked })} />Featured</label></div>
          <div className="grid gap-4 sm:grid-cols-2"><TextField label="Title" value={project.title} onChange={(title) => replace({ ...project, title })} /><TextField label="Slug" value={project.slug} onChange={(slug) => replace({ ...project, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
          {duplicateSlugs.includes(project.slug) && <p className="text-sm text-destructive">This slug is already used.</p>}
          <TextField label="Category" value={project.category} onChange={(category) => replace({ ...project, category })} /><LongField label="Summary" value={project.summary} onChange={(summary) => replace({ ...project, summary })} />
          <TextField label="Technologies (comma separated)" value={project.technologies.join(", ")} onChange={(value) => replace({ ...project, technologies: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          <div className="grid gap-4 sm:grid-cols-3"><TextField label="Repository URL" type="url" value={project.links.repository} onChange={(repository) => replace({ ...project, links: { ...project.links, repository } })} /><TextField label="Live URL" type="url" value={project.links.live} onChange={(live) => replace({ ...project, links: { ...project.links, live } })} /><TextField label="Evidence URL" type="url" value={project.links.evidence} onChange={(evidence) => replace({ ...project, links: { ...project.links, evidence } })} /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Media</CardTitle><CardDescription>Uploads are resized to 1920px maximum and converted to WebP before Storage.</CardDescription></CardHeader><CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-3"><Button asChild variant="outline" disabled={uploading}><label><ImagePlus className="size-4" />Replace cover<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => beginUpload(event, "project_cover")} /></label></Button><Button asChild variant="outline" disabled={uploading}><label><ImagePlus className="size-4" />Add gallery image<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => beginUpload(event, "project_gallery")} /></label></Button>{uploading && <span className="text-sm text-muted-foreground">Optimizing and uploading…</span>}</div>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          <div className="rounded-md border p-3"><p className="text-sm font-medium">Cover</p><p className="mt-1 break-all text-xs text-muted-foreground">{project.cover.path}</p><Input className="mt-3" value={project.cover.alt} aria-label="Cover alt text" onChange={(event) => replace({ ...project, cover: { ...project.cover, alt: event.target.value } })} /></div>
          {project.gallery.map((media, index) => <div key={`${media.path}-${index}`} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto]"><div><p className="break-all text-xs text-muted-foreground">{media.path}</p><Input className="mt-2" value={media.alt} aria-label={`Gallery image ${index + 1} alt text`} onChange={(event) => replace({ ...project, gallery: project.gallery.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item) })} /></div><Button size="icon" variant="ghost" onClick={() => replace({ ...project, gallery: project.gallery.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4 text-destructive" /></Button></div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Case study</CardTitle><CardDescription>Prepare optional project detail content without blocking an ordinary project card.</CardDescription></CardHeader><CardContent className="grid gap-5">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${project.caseStudyEnabled ? "border-primary/60 bg-primary/10" : "border-border bg-muted/20"}`}>
            <input type="checkbox" className="mt-1 size-4 accent-primary" checked={project.caseStudyEnabled} aria-describedby={`case-study-status-${project.id}`} onChange={(event) => replace({ ...project, caseStudyEnabled: event.target.checked })} />
            <span><span className="block text-sm font-medium">Enable case study</span><span id={`case-study-status-${project.id}`} className="mt-1 block text-xs leading-5 text-muted-foreground">{project.caseStudyEnabled ? "Case study enabled in the CMS. Complete the required fields before publishing." : "Case study disabled. These fields are optional and will not block publishing."}</span></span>
          </label>
          {project.caseStudyEnabled && <p className="text-xs text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Required to publish when this project is visible.</p>}
          {(Object.keys(project.caseStudy) as Array<keyof typeof project.caseStudy>).map((field) => <LongField key={field} label={field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())} value={project.caseStudy[field]} placeholder={caseStudyFieldGuidance[field].placeholder} requiredForPublish={project.caseStudyEnabled && caseStudyFieldGuidance[field].requiredForPublish} onChange={(value) => replace({ ...project, caseStudy: { ...project.caseStudy, [field]: value } })} />)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Search metadata</CardTitle></CardHeader><CardContent className="grid gap-5"><TextField label="Page title" value={project.seo.title} onChange={(title) => replace({ ...project, seo: { ...project.seo, title } })} /><LongField label="Description" value={project.seo.description} onChange={(description) => replace({ ...project, seo: { ...project.seo, description } })} /><Button variant="destructive" className="w-fit" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Delete project</Button></CardContent></Card>
      </div> : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Create or select a project.</CardContent></Card>}
    </div>
    <Dialog open={pendingUpload !== null} onOpenChange={(open) => { if (!open && !uploading) setPendingUpload(null); }}>
      <DialogContent showCloseButton={!uploading}>
        <DialogHeader><DialogTitle>Add accessible image text</DialogTitle><DialogDescription>Describe what this image shows. This text is used by screen readers and when an image cannot load.</DialogDescription></DialogHeader>
        <div className="space-y-2"><Label htmlFor="project-image-alt">Image description</Label><Input id="project-image-alt" value={pendingUpload?.alt ?? ""} onChange={(event) => setPendingUpload((current) => current ? { ...current, alt: event.target.value } : null)} autoFocus /></div>
        <DialogFooter><DialogClose asChild><Button variant="outline" disabled={uploading}>Cancel</Button></DialogClose><Button onClick={() => void upload()} disabled={uploading || !pendingUpload?.alt.trim()}>{uploading ? "Uploading…" : "Upload image"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this project?</AlertDialogTitle><AlertDialogDescription>This removes {project?.title ?? "the project"} from the current draft. It will not affect the published portfolio until you publish this draft.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Delete project</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
};
