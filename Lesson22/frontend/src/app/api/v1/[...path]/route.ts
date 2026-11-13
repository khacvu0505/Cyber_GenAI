import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const HOP_HEADERS = new Set(["connection", "content-encoding", "content-length", "host", "keep-alive", "transfer-encoding", "upgrade"]);
type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context): Promise<Response> {
  const origin = process.env.BACKEND_INTERNAL_URL;
  if (!origin) return Response.json({ detail: "BACKEND_INTERNAL_URL is not configured" }, { status: 503 });
  const { path } = await context.params;
  const target = new URL(`/api/v1/${path.map(encodeURIComponent).join("/")}`, origin);
  target.search = request.nextUrl.search;
  const headers = new Headers(request.headers);
  HOP_HEADERS.forEach((header) => headers.delete(header));
  try {
    const upstream = await fetch(target, {
      method: request.method, headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store", redirect: "manual",
    });
    const responseHeaders = new Headers(upstream.headers);
    HOP_HEADERS.forEach((header) => responseHeaders.delete(header));
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ detail: "Backend service is unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

