import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';

export async function GET() {
  try {
    // Check database connection
    await connectDB();
    return NextResponse.json({ status: 'ok', message: 'Doctor Portal is active and healthy.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Database connection failed.' }, { status: 500 });
  }
}
