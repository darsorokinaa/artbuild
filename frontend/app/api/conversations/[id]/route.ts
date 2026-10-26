import { NextRequest, NextResponse } from "next/server";

function forwardHeaders(request: NextRequest) {
  return {
    "Content-Type": "application/json",
    "X-User": request.headers.get("x-user") ?? "",
    Authorization: request.headers.get("authorization") ?? "",
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await fetch(`http://127.0.0.1:8000/api/conversations/${id}/`, {
    headers: forwardHeaders(request),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await fetch(`http://127.0.0.1:8000/api/conversations/${id}/`, {
    method: "POST",
    headers: forwardHeaders(request),
    body: await request.text(),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
