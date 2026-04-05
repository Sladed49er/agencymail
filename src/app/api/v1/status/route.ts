export async function GET() {
  return Response.json({
    status: "ok",
    service: "AgencyMail",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
