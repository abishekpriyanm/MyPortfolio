export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

const isPlaceholder = (value: string) =>
  !value || value.includes("your_supabase") || value.includes("replace_with");

export const readSupabaseEnvironment = (): SupabaseEnvironment | null => {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

  if (isPlaceholder(url) || isPlaceholder(publishableKey)) return null;

  try {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    if (parsed.protocol !== "https:" && !isLocal) return null;
  } catch {
    return null;
  }

  return { url: url.replace(/\/$/, ""), publishableKey };
};
