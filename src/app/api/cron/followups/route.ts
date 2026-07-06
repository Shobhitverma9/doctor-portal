import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Appointment } from '@/models/Appointment';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const targetDate = new Date(todayStart);
    targetDate.setDate(targetDate.getDate() + 1);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const todayStr = todayStart.toISOString().split('T')[0];

    const upcomingFollowups = await Appointment.find({
      status: 'completed',
      followupDate: targetDateStr,
      followupReminderSent: { $ne: true },
      phone: { $exists: true, $ne: '' }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const bookingUrl = `${baseUrl}/`;

    for (const appt of upcomingFollowups) {
      const message = `Dear ${appt.patientName},\n\nThis is a gentle reminder from Dr. Anand Vihari Clinic regarding your upcoming follow-up consultation scheduled for ${appt.followupDate}.\n\nYou can easily book your preferred time slot by visiting our portal: ${bookingUrl}\n\nWe look forward to seeing you!\n\nDr. Anand Vihari Clinic`;
      
      const success = await sendWhatsAppMessage(appt.phone, message);
      if (success) {
        appt.followupReminderSent = true;
        await appt.save();
      }
    }

    const missedFollowups = await Appointment.find({
      status: 'completed',
      followupDate: { $lt: todayStr, $ne: '' },
      missedFollowupSent: { $ne: true },
      phone: { $exists: true, $ne: '' }
    });

    for (const appt of missedFollowups) {
      const message = `Dear ${appt.patientName},\n\nWe noticed you missed your scheduled follow-up on ${appt.followupDate} with Dr. Anand Vihari.\n\nYour health and recovery are our priority. If you'd still like to consult the doctor, you can quickly book a new slot here: ${bookingUrl}\n\nWishing you good health,\nDr. Anand Vihari Clinic`;
      
      const success = await sendWhatsAppMessage(appt.phone, message);
      if (success) {
        appt.missedFollowupSent = true;
        await appt.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersSent: upcomingFollowups.length,
      missedSent: missedFollowups.length 
    });

  } catch (error) {
    console.error('Follow-up cron error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process follow-ups' }, { status: 500 });
  }
}
