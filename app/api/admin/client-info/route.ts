import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || '127.0.0.1';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || '';

    return NextResponse.json({
      ipAddress: ip,
      userAgent: userAgent,
    });
  } catch (error) {
    return NextResponse.json({
      ipAddress: '127.0.0.1',
      userAgent: '',
    });
  }
}
