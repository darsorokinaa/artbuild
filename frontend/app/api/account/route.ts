import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = await fetch("http://127.0.0.1:8000/api/account/", {
    headers: {
      Authorization: request.headers.get("authorization") ?? "",
    },
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
