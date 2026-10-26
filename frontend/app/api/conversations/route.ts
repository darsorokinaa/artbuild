import { NextRequest, NextResponse } from "next/server";

const django = "http://127.0.0.1:8000/api/conversations/";

function forwardHeaders(request: NextRequest) {
  return {
    "Content-Type": "application/json",
    "X-User": request.headers.get("x-user") ?? "",
  };
}

export async function GET(request: NextRequest) {
  const response = await fetch(django, { headers: forwardHeaders(request) });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const response = await fetch(django, {
    method: "POST",
    headers: forwardHeaders(request),
    body: await request.text(),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
