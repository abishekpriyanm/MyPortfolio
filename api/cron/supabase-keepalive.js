const json = (response, status, body) => response.status(status).json(body);

export default async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { ok: false, error: "method_not_allowed" });

  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    return json(response, 401, { ok: false, error: "unauthorized" });
  }

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return json(response, 503, { ok: false, error: "supabase_not_configured" });
  }

  try {
    const result = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/portfolio_versions?select=id&state=eq.published&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!result.ok) return json(response, 502, { ok: false, error: "supabase_unavailable", status: result.status });
    const rows = await result.json();
    return json(response, 200, { ok: true, published: Array.isArray(rows) && rows.length > 0 });
  } catch {
    return json(response, 502, { ok: false, error: "supabase_unavailable" });
  }
}
