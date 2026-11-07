import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PortfolioVersionRow } from "@/lib/supabase/database.types";
import { fallbackPortfolioSnapshot } from "./fallback";
import { createSupabasePortfolioRepository } from "./supabaseRepository";

const adminId = "11111111-1111-4111-8111-111111111111";
const draftRow: PortfolioVersionRow = {
  id: "22222222-2222-4222-8222-222222222222",
  version: 1,
  state: "draft",
  content: fallbackPortfolioSnapshot,
  created_by: adminId,
  created_at: "2026-09-10T12:00:00.000Z",
  updated_at: "2026-09-10T12:00:00.000Z",
  published_at: null,
};

describe("createSupabasePortfolioRepository.createDraft", () => {
  it("creates the first working draft for the authenticated administrator", async () => {
    const single = vi.fn().mockResolvedValue({ data: draftRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminId } }, error: null }) },
      from,
    } as unknown as SupabaseClient<Database>;

    const draft = await createSupabasePortfolioRepository(client).createDraft(fallbackPortfolioSnapshot);

    expect(from).toHaveBeenCalledWith("portfolio_versions");
    expect(insert).toHaveBeenCalledWith({
      state: "draft",
      content: fallbackPortfolioSnapshot,
      created_by: adminId,
    });
    expect(select).toHaveBeenCalledWith("*");
    expect(draft).toMatchObject({ id: draftRow.id, state: "draft", createdBy: adminId });
  });
});

describe("createSupabasePortfolioRepository.publish", () => {
  it("explains server-side case-study validation instead of masking it as an outage", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "22023",
          message: "visible projects with enabled case studies require complete case studies",
        },
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(
      createSupabasePortfolioRepository(client).publish(draftRow.id, draftRow.updated_at)
    ).rejects.toMatchObject({
      code: "invalid-content",
      message: "Complete the required fields for each enabled case study before publishing.",
    });
  });
});
