"use client";

import * as React from "react";

/**
 * Generic POST hook for the sovereignty2 AI endpoints.
 * Returns { run, isLoading, error, data, reset }.
 */
export function useAiEndpoint<TReq, TRes>(url: string) {
  const [data, setData] = React.useState<TRes | null>(null);
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (body: TReq): Promise<TRes | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => ({}))) as TRes & { error?: string };
        if (!res.ok) {
          const msg = json.error ?? `Request failed (${res.status})`;
          setError(msg);
          setData(null);
          return null;
        }
        setData(json);
        return json;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setError(msg);
        setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { run, isLoading, error, data, reset };
}
