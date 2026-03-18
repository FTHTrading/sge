import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Standard JSON-API envelope */
export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json({ ok: false, error: message, ...(errors ? { errors } : {}) }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

/** Parse pagination params from URL search params */
export function parsePagination(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  return { page, limit, skip: (page - 1) * limit };
}

/** Parse optional search param */
export function parseSearch(req: NextRequest): string | undefined {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? url.searchParams.get("search");
  return q?.trim() || undefined;
}

/** Parse a single filter param */
export function parseFilter(req: NextRequest, key: string): string | undefined {
  const url = new URL(req.url);
  return url.searchParams.get(key) ?? undefined;
}
