import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthStage =
  | "loading"
  | "configuration-error"
  | "signed-out"
  | "unauthorized"
  | "mfa-enroll"
  | "mfa-challenge"
  | "ready";

type Enrollment = { factorId: string; qrCode: string; secret: string };

type AuthContextValue = {
  stage: AuthStage;
  user: User | null;
  enrollment: Enrollment | null;
  error: string;
  signIn(email: string, password: string): Promise<void>;
  beginEnrollment(): Promise<void>;
  verifyMfa(code: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [stage, setStage] = useState<AuthStage>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStage("configuration-error");
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    const activeUser = sessionData.session?.user ?? null;
    setUser(activeUser);
    setEnrollment(null);
    setError("");

    if (!activeUser) {
      setStage("signed-out");
      return;
    }

    const { data: admin, error: adminError } = await client
      .from("portfolio_admins")
      .select("user_id")
      .eq("user_id", activeUser.id)
      .maybeSingle();

    if (adminError || !admin) {
      setStage("unauthorized");
      return;
    }

    const { data: assurance, error: assuranceError } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) {
      setError(assuranceError.message);
      setStage("signed-out");
      return;
    }
    if (assurance.currentLevel === "aal2") {
      setStage("ready");
      return;
    }

    const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setStage("signed-out");
      return;
    }
    const factor = factors.totp.find((item) => item.status === "verified");
    if (factor) {
      setVerifiedFactorId(factor.id);
      setStage("mfa-challenge");
    } else {
      setVerifiedFactorId(null);
      setStage("mfa-enroll");
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    void refresh();
    if (!client) return;
    const { data } = client.auth.onAuthStateChange(() => window.setTimeout(() => void refresh(), 0));
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) return setStage("configuration-error");
    setError("");
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setStage("signed-out");
      return;
    }
    await refresh();
  };

  const beginEnrollment = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setError("");
    const { data, error: enrollError } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Portfolio admin",
    });
    if (enrollError) return setError(enrollError.message);
    setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const verifyMfa = async (code: string) => {
    const client = getSupabaseClient();
    const factorId = enrollment?.factorId ?? verifiedFactorId;
    if (!client || !factorId) return;
    setError("");
    const { error: verifyError } = await client.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) return setError(verifyError.message);
    await refresh();
  };

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setStage("signed-out");
  };

  const value = { stage, user, enrollment, error, signIn, beginEnrollment, verifyMfa, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAdminAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAdminAuth must be used within AuthProvider");
  return value;
};
