import { NextResponse } from 'next/server';
import { initWhatsApp, getWhatsAppStatus } from '@/lib/whatsapp';

export async function POST() {
  const status = getWhatsAppStatus();
  
  if (status.status === 'disconnected') {
    initWhatsApp();
  }
  
  return NextResponse.json({ success: true, message: 'Initialization requested' });
}
