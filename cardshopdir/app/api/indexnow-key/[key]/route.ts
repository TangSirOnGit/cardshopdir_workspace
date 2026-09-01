import { NextResponse } from "next/server"

const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const configuredKey = process.env.INDEXNOW_KEY
  const { key } = await params

  if (
    !configuredKey ||
    !INDEXNOW_KEY_PATTERN.test(configuredKey) ||
    key !== configuredKey
  ) {
    return new NextResponse("Not found", { status: 404 })
  }

  return new NextResponse(configuredKey, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
