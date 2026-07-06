import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, patientName, diagnosis, medicines, notes, followUpDate, doctorName } = body;

    if (!phone || !patientName || !medicines || !Array.isArray(medicines)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const docName = doctorName || 'Doctor';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let message = `🏥 *Prescription Summary*\n`;
    message += `🧑‍⚕️ Dr. ${docName}\n`;
    message += `📅 Date: ${dateStr}\n`;
    message += `👤 Patient: ${patientName}\n`;
    message += `📝 Diagnosis: ${diagnosis}\n\n`;
    message += `💊 *Medicines prescribed:*\n`;

    medicines.forEach((med: any, index: number) => {
      message += `${index + 1}. *${med.name}*\n`;
      message += `   Dosage: ${med.dosage || ''} ${med.frequency} for ${med.duration}\n`;
      if (med.instructions) {
        message += `   Instructions: ${med.instructions}\n`;
      }
      message += `\n`;
    });

    if (notes) {
      message += `📌 *Notes:* ${notes}\n\n`;
    }

    if (followUpDate) {
      const followUp = new Date(followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      message += `🗓️ *Follow-up Date:* ${followUp}\n`;
    }

    message += `\n_This is a digitally generated summary._`;

    const success = await sendWhatsAppMessage(phone, message);

    if (success) {
      return NextResponse.json({ success: true, message: 'Prescription sent via WhatsApp' });
    } else {
      return NextResponse.json({ error: 'Failed to send WhatsApp message. Ensure the system is connected to WhatsApp.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending whatsapp prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
