import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { useDraft } from "@/admin/features/content/DraftProvider";

export const AboutPage = () => {
  const { content, setContent } = useDraft();
  const update = (field: keyof typeof content.about, value: unknown) => setContent((current) => ({ ...current, about: { ...current.about, [field]: value } }));
  const updateSocial = (field: keyof typeof content.about.social, value: string) => setContent((current) => ({ ...current, about: { ...current.about, social: { ...current.about.social, [field]: value } } }));
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-semibold tracking-tight">About</h1><p className="mt-2 text-muted-foreground">Public identity, biography, contact details, and profile links.</p></div>
      <Card><CardHeader><CardTitle>Profile copy</CardTitle><CardDescription>Plain text only. Paragraph breaks are preserved.</CardDescription></CardHeader><CardContent className="grid gap-5">
        <div className="space-y-2"><Label htmlFor="about-name">Public name</Label><Input id="about-name" value={content.about.name} onChange={(event) => update("name", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="about-title">Section title</Label><Input id="about-title" value={content.about.title} onChange={(event) => update("title", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="about-description">Biography</Label><Textarea id="about-description" rows={12} value={content.about.description} onChange={(event) => update("description", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="about-roles">Roles (comma separated)</Label><Input id="about-roles" value={content.about.roles.join(", ")} onChange={(event) => update("roles", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" value={content.about.location} onChange={(event) => update("location", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={content.about.email} onChange={(event) => update("email", event.target.value)} /></div></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Social links</CardTitle><CardDescription>Leave a service blank when it should not appear.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        {Object.entries(content.about.social).map(([key, value]) => <div className="space-y-2" key={key}><Label htmlFor={`social-${key}`} className="capitalize">{key}</Label><Input id={`social-${key}`} type="url" placeholder="https://" value={value} onChange={(event) => updateSocial(key as keyof typeof content.about.social, event.target.value)} /></div>)}
      </CardContent></Card>
    </div>
  );
};
