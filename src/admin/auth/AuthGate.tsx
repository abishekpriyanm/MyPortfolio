import { useState, type FormEvent, type PropsWithChildren } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/admin/components/ui/alert";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { useAdminAuth } from "./AuthProvider";

const Frame = ({ children }: PropsWithChildren) => (
  <main className="grid min-h-screen place-items-center bg-background px-5 py-12">
    <div className="w-full max-w-md">{children}</div>
  </main>
);

export const AuthGate = ({ children }: PropsWithChildren) => {
  const auth = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (auth.stage === "loading") {
    return <Frame><Skeleton className="h-72 w-full" /></Frame>;
  }

  if (auth.stage === "configuration-error") {
    return (
      <Frame>
        <Alert variant="destructive">
          <AlertTitle>Supabase is not configured</AlertTitle>
          <AlertDescription>
            Create .env.local from .env.example, add the project URL and browser-safe
            publishable key, then restart Vite.
          </AlertDescription>
        </Alert>
      </Frame>
    );
  }

  if (auth.stage === "unauthorized") {
    return (
      <Frame>
        <Card>
          <CardHeader><CardTitle>Access denied</CardTitle><CardDescription>This account is not the allowlisted portfolio administrator.</CardDescription></CardHeader>
          <CardContent><Button variant="outline" onClick={() => void auth.signOut()}>Sign out</Button></CardContent>
        </Card>
      </Frame>
    );
  }

  if (auth.stage === "signed-out") {
    const submit = async (event: FormEvent) => {
      event.preventDefault();
      setBusy(true);
      await auth.signIn(email, password);
      setBusy(false);
    };
    return (
      <Frame>
        <Card>
          <CardHeader><CardTitle>Portfolio admin</CardTitle><CardDescription>Sign in with the single allowlisted account.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              {auth.error && <p role="alert" className="text-sm text-destructive">{auth.error}</p>}
              <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
          </CardContent>
        </Card>
      </Frame>
    );
  }

  if (auth.stage === "mfa-enroll" || auth.stage === "mfa-challenge") {
    const submit = async (event: FormEvent) => {
      event.preventDefault();
      setBusy(true);
      await auth.verifyMfa(code);
      setBusy(false);
    };
    return (
      <Frame>
        <Card>
          <CardHeader>
            <CardTitle>{auth.stage === "mfa-enroll" ? "Secure this account" : "Two-factor verification"}</CardTitle>
            <CardDescription>{auth.stage === "mfa-enroll" ? "Add this account to an authenticator before opening the CMS." : "Enter the current code from your authenticator."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {auth.stage === "mfa-enroll" && !auth.enrollment && <Button onClick={() => void auth.beginEnrollment()}>Generate authenticator QR</Button>}
            {auth.enrollment && <div className="space-y-3 rounded-lg border bg-white p-4 text-black"><img className="mx-auto size-48" src={auth.enrollment.qrCode} alt="Authenticator enrollment QR code" /><p className="break-all font-mono text-xs">Manual key: {auth.enrollment.secret}</p></div>}
            {(auth.stage === "mfa-challenge" || auth.enrollment) && (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2"><Label htmlFor="mfa-code">Six-digit code</Label><Input id="mfa-code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
                {auth.error && <p role="alert" className="text-sm text-destructive">{auth.error}</p>}
                <Button className="w-full" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify"}</Button>
              </form>
            )}
            <Button variant="ghost" onClick={() => void auth.signOut()}>Use another account</Button>
          </CardContent>
        </Card>
      </Frame>
    );
  }

  return children;
};
