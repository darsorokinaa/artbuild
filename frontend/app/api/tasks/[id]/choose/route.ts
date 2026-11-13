import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await fetch(`http://127.0.0.1:8000/api/tasks/${id}/choose/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: request.headers.get("authorization") ?? "",
    },
    body: await request.text(),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
