import { NextRequest, NextResponse } from "next/server";

function forward(request: NextRequest, contentType?: string | null) {
  const headers: Record<string, string> = {
    Authorization: request.headers.get("authorization") ?? "",
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? "";
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`http://127.0.0.1:8000/api/tasks/${query}`, {
    headers: forward(request),
    cache: "no-store",
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const response = await fetch("http://127.0.0.1:8000/api/tasks/", {
    method: "POST",
    headers: forward(request, request.headers.get("content-type") || "application/json"),
    body: Buffer.from(await request.arrayBuffer()),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
