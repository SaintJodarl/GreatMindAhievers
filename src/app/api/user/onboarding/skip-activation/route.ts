import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      message:
        'Activation skip is no longer allowed. Please provide an activation code during registration.',
    },
    { status: 403 }
  );
}
