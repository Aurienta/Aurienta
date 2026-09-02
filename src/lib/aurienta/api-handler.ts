import { NextRequest } from "next/server";

/**
 * withErrorHandler — a higher-order wrapper for Next.js App Router route
 * handlers (GET / POST / PUT / DELETE / PATCH) that:
 *
 *  - Catches any error thrown inside the handler.
 *  - Logs the error to console with the route label + HTTP method for traceability.
 *  - Translates known API errors (with `statusCode`) to their status + message.
 *  - Translates Prisma errors (codes starting with P, e.g. P2002 / P2025 / P2003)
 *    into clean 4xx responses.
 *  - Translates Zod validation errors (objects with an `issues` array) into
 *    400 Bad Request with the first issue message.
 *  - Falls back to a generic 500 Internal Server Error with NO stack trace leak.
 *
 * The wrapper preserves the underlying handler signature (Request + optional ctx).
 * `Request` is assignable to `NextRequest`, so existing handlers typed with
 * `Request` work without any change.
 */

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<Response>;

interface HttpError extends Error {
  statusCode?: number;
}

function isHttpError(e: unknown): e is HttpError {
  return e instanceof Error && "statusCode" in e;
}

function isPrismaError(e: unknown): e is { code: string; message: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as any).code === "string" &&
    (e as any).code.startsWith("P")
  );
}

function isZodError(
  e: unknown
): e is { issues: Array<{ message: string }> } {
  return (
    typeof e === "object" &&
    e !== null &&
    "issues" in e &&
    Array.isArray((e as any).issues)
  );
}

export function withErrorHandler(
  handler: RouteHandler,
  label?: string
): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      // Re-throw Next.js internal control-flow errors (redirect / notFound /
      // http). They're not real errors — they're framework signals that
      // Next.js catches upstream. Wrapping them as 500s would break
      // `redirect("/signin")` etc.
      const digest = (error as any)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_")) {
        throw error;
      }

      const tag =
        label ?? `${req.method} ${new URL(req.url).pathname}`;
      console.error(`[api] ${tag} failed:`, error);

      if (isZodError(error)) {
        return Response.json(
          { error: "Validation failed", detail: error.issues[0]?.message },
          { status: 400 }
        );
      }

      if (isHttpError(error) && error.statusCode) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      if (isPrismaError(error)) {
        const code = error.code;
        if (code === "P2002")
          return Response.json(
            { error: "Resource already exists" },
            { status: 409 }
          );
        if (code === "P2025")
          return Response.json(
            { error: "Resource not found" },
            { status: 404 }
          );
        if (code === "P2003")
          return Response.json(
            { error: "Referenced resource does not exist" },
            { status: 400 }
          );
        return Response.json({ error: "Database error" }, { status: 500 });
      }

      // Never leak stack traces to the client.
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
