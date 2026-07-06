import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Appointment } from '@/models/Appointment';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const recentAppointment = await Appointment.findOne({ phone }).sort({ createdAt: -1 });

    if (recentAppointment) {
      return NextResponse.json({
        success: true,
        data: {
          name: recentAppointment.patientName,
          email: recentAppointment.email,
          age: recentAppointment.age
        }
      });
    } else {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch patient' }, { status: 500 });
  }
}
