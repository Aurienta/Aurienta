import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai/diagnose
// Diagnostic endpoint: lists available models from each AI provider.
// Temporary — can be removed after diagnosis is complete.
export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};

  // 1. Groq — list models
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        results.groq = {
          status: "ok",
          models: (d.data || []).map((m: any) => m.id).slice(0, 20),
        };
      } else {
        results.groq = { status: "error", code: r.status, body: (await r.text()).slice(0, 200) };
      }
    } catch (e: any) {
      results.groq = { status: "fetch_error", error: e.message };
    }
  } else {
    results.groq = { status: "not_configured" };
  }

  // 2. NVIDIA — list models
  if (process.env.NVIDIA_API_KEY) {
    try {
      const r = await fetch("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        results.nvidia = {
          status: "ok",
          modelCount: (d.data || []).length,
          models: (d.data || []).map((m: any) => m.id).slice(0, 15),
        };
      } else {
        results.nvidia = { status: "error", code: r.status, body: (await r.text()).slice(0, 200) };
      }
    } catch (e: any) {
      results.nvidia = { status: "fetch_error", error: e.message };
    }
  } else {
    results.nvidia = { status: "not_configured" };
  }

  // 3. HuggingFace — whoami
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const r = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        results.huggingface = {
          status: "ok",
          user: d.name,
          type: d.type,
          orgs: (d.orgs || []).map((o: any) => o.name),
        };
      } else {
        results.huggingface = { status: "error", code: r.status, body: (await r.text()).slice(0, 200) };
      }
    } catch (e: any) {
      results.huggingface = { status: "fetch_error", error: e.message };
    }
  } else {
    results.huggingface = { status: "not_configured" };
  }

  // 4. OpenRouter — list free models
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const d = await r.json();
        const free = (d.data || []).filter((m: any) => m.id.includes(":free"));
        results.openrouter = {
          status: "ok",
          totalModels: (d.data || []).length,
          freeModels: free.map((m: any) => m.id).slice(0, 10),
        };
      } else {
        results.openrouter = { status: "error", code: r.status };
      }
    } catch (e: any) {
      results.openrouter = { status: "fetch_error", error: e.message };
    }
  } else {
    results.openrouter = { status: "not_configured" };
  }

  // 5. Gemini — list models
  if (process.env.GEMINI_API_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (r.ok) {
        const d = await r.json();
        results.gemini = {
          status: "ok",
          models: (d.models || []).map((m: any) => m.name).slice(0, 15),
        };
      } else {
        const body = await r.text();
        results.gemini = { status: "error", code: r.status, body: body.slice(0, 200) };
      }
    } catch (e: any) {
      results.gemini = { status: "fetch_error", error: e.message };
    }
  } else {
    results.gemini = { status: "not_configured" };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providers: results,
  });
}
