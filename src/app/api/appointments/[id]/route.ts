import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Appointment } from '@/models/Appointment';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (body.status === 'completed' && updatedAppointment.phone) {
      let message = `Dear ${updatedAppointment.patientName},\n\nThank you for visiting Dr. Anand Vihari. We hope you had a satisfactory experience with us. We would greatly appreciate it if you could take a moment to share your feedback here: https://g.page/r/your-review-link/review.`;
      
      if (body.followupDate) {
        message += `\n\nAdditionally, Dr. Anand has advised a follow-up consultation on ${body.followupDate}. Kindly reach out to us closer to the date to confirm your preferred time slot.\n\nWishing you good health and a speedy recovery,\nDr. Anand Vihari Clinic`;
      } else {
        message += `\n\nWishing you good health and a speedy recovery,\nDr. Anand Vihari Clinic`;
      }
      
      await sendWhatsAppMessage(updatedAppointment.phone, message);
    }

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedAppointment });
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete appointment' }, { status: 500 });
  }
}
