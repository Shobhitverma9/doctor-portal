import { NextResponse } from 'next/server';
import { logoutWhatsApp } from '@/lib/whatsapp';

export async function POST() {
  await logoutWhatsApp();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
