// app/api/sessionLogout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie found' }, { status: 400 });
    }

    // Decode the session to get UID
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Revoke all sessions for this user (optional, more secure)
    await adminAuth.revokeRefreshTokens(decodedClaims.sub);

    // Clear the cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set('__session', '', {
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Session Logout Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to log out', details: error.message },
      { status: 401 }
    );
  }
}
