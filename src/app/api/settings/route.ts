import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Settings } from '@/models/Settings';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        closedDates: [],
        closedDaysOfWeek: [],
      });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings(body);
    } else {
      if (body.closedDates !== undefined) settings.closedDates = body.closedDates;
      if (body.closedDaysOfWeek !== undefined) settings.closedDaysOfWeek = body.closedDaysOfWeek;
    }

    await settings.save();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
