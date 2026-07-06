import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    let role = '';
    if (password === 'doctor123') role = 'doctor';
    else if (password === 'admin123') role = 'admin';
    else if (password === 'reception123') role = 'receptionist';

    if (role) {
      (await cookies()).set('portal_auth', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/portal',
      });

      return NextResponse.json({ success: true, role });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  (await cookies()).delete('portal_auth');
  return NextResponse.json({ success: true });
}
