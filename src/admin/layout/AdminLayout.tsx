import { NavLink, Outlet } from "react-router-dom";
import { AlertCircle, BriefcaseBusiness, FileText, Gauge, LogOut, Rocket, Save, UserRound, Workflow } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/admin/components/ui/alert";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { useAdminAuth } from "@/admin/auth/AuthProvider";
import { useDraft } from "@/admin/features/content/DraftProvider";

const links = [
  { to: "/admin", label: "Overview", icon: Gauge, end: true },
  { to: "/admin/about", label: "About", icon: UserRound },
  { to: "/admin/career", label: "Career", icon: Workflow },
  { to: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
  { to: "/admin/resume", label: "Resume", icon: FileText },
  { to: "/admin/preview", label: "Preview", icon: Rocket },
];

export const AdminLayout = () => {
  const { signOut, user } = useAdminAuth();
  const draft = useDraft();

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div><p className="text-sm font-semibold">Portfolio CMS</p><p className="text-xs text-muted-foreground">Private workspace</p></div>
          <Badge variant={draft.dirty ? "secondary" : "outline"}>{draft.dirty ? "Unsaved" : "Saved"}</Badge>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col" aria-label="Admin sections">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon className="size-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 lg:absolute lg:bottom-0 lg:w-full">
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="ghost" className="w-full justify-start" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</Button>
        </div>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl lg:px-8">
          <p className="text-sm text-muted-foreground">Draft v{draft.draft?.version ?? "—"}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={draft.loading || draft.saving || (draft.draft ? !draft.dirty : !draft.canCreateDraft)} onClick={() => void draft.save()}><Save className="size-4" />{draft.saving ? "Saving…" : draft.draft ? "Save draft" : "Create draft"}</Button>
            <Button disabled={draft.saving || draft.issues.length > 0} onClick={() => void draft.publish()}><Rocket className="size-4" />Publish</Button>
          </div>
        </header>
        <div className="w-full max-w-[1440px] space-y-5 p-5 lg:p-8">
          {draft.error && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>{draft.canCreateDraft ? "Create your first working draft" : "Action failed"}</AlertTitle><AlertDescription>{draft.canCreateDraft ? "No working draft exists yet. Create one from the content currently shown in the editor; this will not publish anything." : draft.error}</AlertDescription></Alert>}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
