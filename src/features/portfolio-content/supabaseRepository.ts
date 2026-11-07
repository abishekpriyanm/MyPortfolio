import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, PortfolioVersionRow } from "../../lib/supabase/database.types";
import { getSupabaseClient } from "../../lib/supabase/client";
import { parsePortfolioSnapshot } from "./schema";
import {
  PortfolioRepositoryError,
  type PortfolioRepository,
} from "./repository";
import type { PortfolioVersion } from "./types";

const mapVersion = (row: PortfolioVersionRow): PortfolioVersion => ({
  id: row.id,
  version: row.version,
  state: row.state,
  content: parsePortfolioSnapshot(row.content),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publishedAt: row.published_at,
});

const throwRepositoryError = (error: { code?: string; message: string }): never => {
  if (error.code === "42501" || /permission|authorized/i.test(error.message)) {
    throw new PortfolioRepositoryError("unauthorized", "You do not have access to this content.", {
      cause: error,
    });
  }
  if (error.code === "40001" || /changed since/i.test(error.message)) {
    throw new PortfolioRepositoryError("stale", "This draft changed in another session.", {
      cause: error,
    });
  }
  if (error.code === "P0002") {
    throw new PortfolioRepositoryError("not-found", "The requested portfolio version was not found.", {
      cause: error,
    });
  }
  if (error.code === "22023" && /case stud(?:y|ies)/i.test(error.message)) {
    throw new PortfolioRepositoryError(
      "invalid-content",
      "Complete the required fields for each enabled case study before publishing.",
      { cause: error }
    );
  }
  throw new PortfolioRepositoryError("unavailable", "Portfolio data is temporarily unavailable.", {
    cause: error,
  });
};

const unwrapComposite = <T>(value: T | T[] | null): T => {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item) {
    throw new PortfolioRepositoryError("not-found", "The requested portfolio version was not found.");
  }
  return item;
};

export const createSupabasePortfolioRepository = (
  client: SupabaseClient<Database>
): PortfolioRepository => ({
  async getPublished() {
    const { data, error } = await client
      .from("portfolio_versions")
      .select("*")
      .eq("state", "published")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throwRepositoryError(error);
    return data ? mapVersion(data) : null;
  },

  async getDraft() {
    const { data, error } = await client
      .from("portfolio_versions")
      .select("*")
      .eq("state", "draft")
      .limit(1)
      .maybeSingle();

    if (error) throwRepositoryError(error);
    if (!data) throw new PortfolioRepositoryError("not-found", "No working draft exists.");
    return mapVersion(data);
  },

  async createDraft(content) {
    const parsed = parsePortfolioSnapshot(content);
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      throw new PortfolioRepositoryError("unauthorized", "You do not have access to create a working draft.", {
        cause: userError,
      });
    }

    const { data, error } = await client
      .from("portfolio_versions")
      .insert({
        state: "draft",
        content: parsed as unknown as Json,
        created_by: userData.user.id,
      })
      .select("*")
      .single();

    if (error) throwRepositoryError(error);
    if (!data) {
      throw new PortfolioRepositoryError("unavailable", "The working draft could not be created.");
    }
    return mapVersion(data);
  },

  async saveDraft(id, content, expectedUpdatedAt) {
    const parsed = parsePortfolioSnapshot(content);
    const { data, error } = await client
      .from("portfolio_versions")
      .update({ content: parsed as unknown as Json })
      .eq("id", id)
      .eq("state", "draft")
      .eq("updated_at", expectedUpdatedAt)
      .select("*")
      .maybeSingle();

    if (error) throwRepositoryError(error);
    if (!data) {
      throw new PortfolioRepositoryError("stale", "This draft changed in another session.");
    }
    return mapVersion(data);
  },

  async publish(id, expectedUpdatedAt) {
    const { data, error } = await client.rpc("publish_portfolio", {
      p_draft_id: id,
      p_expected_updated_at: expectedUpdatedAt,
    });

    if (error) throwRepositoryError(error);
    return mapVersion(unwrapComposite(data));
  },

  async listHistory() {
    const { data, error } = await client
      .from("portfolio_versions")
      .select("*")
      .neq("state", "draft")
      .order("version", { ascending: false });

    if (error) throwRepositoryError(error);
    return (data ?? []).map(mapVersion);
  },

  async rollback(id) {
    const { data, error } = await client.rpc("rollback_portfolio", {
      p_version_id: id,
    });

    if (error) throwRepositoryError(error);
    return mapVersion(unwrapComposite(data));
  },
});

export const getPortfolioRepository = (): PortfolioRepository => {
  const client = getSupabaseClient();
  if (!client) {
    throw new PortfolioRepositoryError(
      "not-configured",
      "Supabase is not configured. Add the browser-safe values from .env.example."
    );
  }
  return createSupabasePortfolioRepository(client);
};
