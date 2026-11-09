export function GET() {
  return Response.json({
    ok: true,
    service: "mythos",
    timestamp: new Date().toISOString(),
  });
}
