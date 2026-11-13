import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await fetch(`http://127.0.0.1:8000/api/tasks/${id}/responses/`, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/json",
      Authorization: request.headers.get("authorization") ?? "",
    },
    body: Buffer.from(await request.arrayBuffer()),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
