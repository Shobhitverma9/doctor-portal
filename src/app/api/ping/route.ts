import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'awake', 
      message: 'Server is running', 
      timestamp: new Date().toISOString() 
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  );
}
