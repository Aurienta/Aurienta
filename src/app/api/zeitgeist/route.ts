// GET /api/zeitgeist — latest snapshot + history.
// Query: ?days=30 (1..365)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  computeZeitgeistSnapshot,
  getHistory,
  getLatestSnapshot,
} from "@/lib/aurienta/zeitgeist";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1),
    365
  );
  const refresh = url.searchParams.get("refresh") === "1";

  // Refresh the snapshot if requested (or if no snapshot exists yet).
  let latest = await getLatestSnapshot();
  if (refresh || !latest) {
    try {
      latest = await computeZeitgeistSnapshot();
    } catch (e) {
      // Don't fail the whole endpoint if computation errors — fall back to
      // the latest existing snapshot (if any) and surface a warning.
      console.error("[zeitgeist] compute failed:", e);
    }
  }

  const history = await getHistory(days);

  await audit({
    actorId: user.id,
    action: "zeitgeist.read",
    target: "platform",
    result: "allowed",
    metadata: {
      latestDate: latest?.date ?? null,
      historyCount: history.length,
      days,
      refreshed: refresh,
    },
  });

  return NextResponse.json({
    latest: latest
      ? {
          ...latest,
          computedAt: latest.computedAt.toISOString(),
        }
      : null,
    history: history.map((h) => ({
      ...h,
      computedAt: h.computedAt.toISOString(),
    })),
    disclaimer: "Sentiment is informational, NOT investment advice.",
    count: history.length,
  });
}, "GET /api/zeitgeist");
