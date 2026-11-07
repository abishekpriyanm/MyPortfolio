import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { loadCachedPortfolio, saveCachedPortfolio } from "./cache";
import { fallbackPortfolioSnapshot } from "./fallback";
import type { PortfolioSnapshot } from "./schema";

type PortfolioContextValue = {
  content: PortfolioSnapshot;
  source: "fallback" | "cache" | "live";
};

const PortfolioContext = createContext<PortfolioContextValue>({ content: fallbackPortfolioSnapshot, source: "fallback" });

const getMediaUrl = async (path: string, client: SupabaseClient<Database>) => {
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;
  const { data, error } = await client.storage.from("portfolio-media").createSignedUrl(path, 60 * 60);
  return error ? path : data.signedUrl;
};

const resolveMedia = async (content: PortfolioSnapshot, client: SupabaseClient<Database>): Promise<PortfolioSnapshot> => ({
  ...content,
  projects: await Promise.all(content.projects.map(async (project) => ({
    ...project,
    cover: { ...project.cover, path: await getMediaUrl(project.cover.path, client) },
    gallery: await Promise.all(project.gallery.map(async (media) => ({ ...media, path: await getMediaUrl(media.path, client) }))),
  }))),
});

export const PortfolioProvider = ({ children }: PropsWithChildren) => {
  const cached = useMemo(() => loadCachedPortfolio(), []);
  const [content, setContent] = useState(cached?.content ?? fallbackPortfolioSnapshot);
  const [source, setSource] = useState<PortfolioContextValue["source"]>(cached ? "cache" : "fallback");

  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ getSupabaseClient }, { createSupabasePortfolioRepository }] = await Promise.all([
        import("@/lib/supabase/client"),
        import("./supabaseRepository"),
      ]);
      const client = getSupabaseClient();
      if (!client || !active) return;
      setContent(await resolveMedia(cached?.content ?? fallbackPortfolioSnapshot, client));
      const published = await createSupabasePortfolioRepository(client).getPublished();
      if (!active || !published) return;
      saveCachedPortfolio({ version: published.version, content: published.content });
      setContent(await resolveMedia(published.content, client));
      setSource("live");
    })().catch(() => undefined);
    return () => { active = false; };
  }, [cached]);

  return <PortfolioContext.Provider value={{ content, source }}>{children}</PortfolioContext.Provider>;
};

export const usePortfolio = () => useContext(PortfolioContext);
