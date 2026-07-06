import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Appointment } from '@/models/Appointment';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const query: any = {};
    if (date) {
      query.date = date;
    }

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const newAppointment = await Appointment.create({
      ...body,
      status: 'pending'
    });

    if (body.phone) {
      const message = `Hello ${body.patientName}, your appointment with Dr. Anand is confirmed for ${body.date} at ${body.timeSlot}.\n\nKindly try to reach 15 mins prior to your appointment time to give vitals, and please remember to bring any previous medical documents or reports.\n\nSee you soon!`;
      await sendWhatsAppMessage(body.phone, message);
    }

    return NextResponse.json({ success: true, data: newAppointment });
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create appointment' }, { status: 500 });
  }
}
