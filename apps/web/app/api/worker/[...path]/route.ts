import { type NextRequest } from "next/server";

const proxyableResponseHeaders = new Set([
  "cache-control",
  "content-disposition",
  "content-length",
  "content-type",
  "etag",
  "last-modified",
]);

function resolveWorkerBaseUrl() {
  const rawValue =
    process.env.DOCX_REDLINE_WORKER_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    "http://127.0.0.1:8000";
  const trimmed = rawValue.replace(/\/$/, "");

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  if (
    trimmed.includes("localhost") ||
    trimmed.startsWith("127.0.0.1") ||
    trimmed.endsWith(".internal") ||
    /:\d+$/.test(trimmed)
  ) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const workerUrl = new URL(`${resolveWorkerBaseUrl()}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    workerUrl.searchParams.append(key, value);
  });

  const upstreamHeaders = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    upstreamHeaders.set("content-type", contentType);
  }

  const response = await fetch(workerUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (proxyableResponseHeaders.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}
