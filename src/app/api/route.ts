import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const GET = withErrorHandler(async () => {
  return NextResponse.json({ message: "Hello, world!" });
}, "GET /api");