import { env } from "@/lib/env";

function readBearerToken(value: string | null): string | null {
  if (!value) return null;
  const [scheme, token] = value.trim().split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export function getControlApiKeyFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key")?.trim();
  if (queryKey) return queryKey;

  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const bearerKey = readBearerToken(request.headers.get("authorization"));
  if (bearerKey) return bearerKey;

  return null;
}

export function isControlApiAuthorized(request: Request): boolean {
  const provided = getControlApiKeyFromRequest(request);
  return Boolean(provided && provided === env.CONTROL_API_KEY);
}

