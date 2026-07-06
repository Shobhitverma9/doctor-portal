import { NextResponse } from 'next/server';
import { getWhatsAppStatus } from '@/lib/whatsapp';

export async function GET() {
  const status = getWhatsAppStatus();
  return NextResponse.json({ success: true, data: status });
}
