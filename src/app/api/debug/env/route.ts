export async function GET() {
  return Response.json({
    MLM_EVENT_MODE: process.env.MLM_EVENT_MODE,
    LEGACY_WRITE_DISABLED: process.env.LEGACY_WRITE_DISABLED,
    NODE_ENV: process.env.NODE_ENV
  });
}
