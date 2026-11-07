import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./supabase-keepalive.js";

const response = () => {
  const state = { status: 0, body: null };
  return {
    state,
    status(code) { state.status = code; return this; },
    json(body) { state.body = body; return this; },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CRON_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
});

describe("Supabase keepalive cron", () => {
  it("rejects requests without the cron bearer secret", async () => {
    process.env.CRON_SECRET = "test-secret";
    const result = response();
    await handler({ method: "GET", headers: {} }, result);
    expect(result.state).toEqual({ status: 401, body: { ok: false, error: "unauthorized" } });
  });

  it("performs one anonymous read when authorized", async () => {
    process.env.CRON_SECRET = "test-secret";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "version-id" }] });
    vi.stubGlobal("fetch", fetchMock);
    const result = response();
    await handler({ method: "GET", headers: { authorization: "Bearer test-secret" } }, result);
    expect(result.state).toEqual({ status: 200, body: { ok: true, published: true } });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].headers.apikey).toBe("publishable-key");
  });
});
