// Debug endpoint — restricted to development environment only
export async function GET() {
  // SECURITY: Only expose debug info in development
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ message: 'Not available in production' }, { status: 404 });
  }

  return Response.json({
    MLM_EVENT_MODE: process.env.MLM_EVENT_MODE,
    LEGACY_WRITE_DISABLED: process.env.LEGACY_WRITE_DISABLED,
  });
}
