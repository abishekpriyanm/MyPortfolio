import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Check, ExternalLink, FileUp } from "lucide-react";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { activateResume, getResumeUrl, listResumes, uploadResume } from "@/admin/features/resume/resumeRepository";
import type { ResumeVersionRow } from "@/lib/supabase/database.types";

export const ResumePage = () => {
  const [resumes, setResumes] = useState<ResumeVersionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try { setResumes(await listResumes()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load resume history."); }
  }, []);
  useEffect(() => void refresh(), [refresh]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError("");
    try { await uploadResume(file); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  };
  const activate = async (id: string) => { setBusy(true); setError(""); try { await activateResume(id); await refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Activation failed."); } finally { setBusy(false); } };
  const view = async (path: string) => {
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    try {
      const url = await getResumeUrl(path);
      if (preview) preview.location.replace(url);
      else window.location.assign(url);
    } catch (caught) {
      preview?.close();
      setError(caught instanceof Error ? caught.message : "Could not create a secure view link.");
    }
  };

  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Resume</h1><p className="mt-2 text-muted-foreground">Keep immutable PDF versions and choose exactly one public resume.</p></div><Button asChild disabled={busy}><label><FileUp className="size-4" />Upload PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => void upload(event)} /></label></Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>Version history</CardTitle><CardDescription>Uploading does not publish automatically. Activate the reviewed file explicitly.</CardDescription></CardHeader><CardContent className="divide-y divide-border">
      {resumes.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No resume has been uploaded.</p>}
      {resumes.map((resume) => <div key={resume.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">v{resume.version} · {resume.original_filename} {resume.is_active && <Badge className="ml-2"><Check className="size-3" />Active</Badge>}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(resume.created_at).toLocaleString()} · {(resume.byte_size / 1024 / 1024).toFixed(2)} MB</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void view(resume.storage_path)}><ExternalLink className="size-4" />View</Button>{!resume.is_active && <Button size="sm" disabled={busy} onClick={() => void activate(resume.id)}>Make active</Button>}</div></div>)}
    </CardContent></Card>
  </div>;
};
