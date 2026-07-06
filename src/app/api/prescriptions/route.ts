import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Prescription } from '@/models/Prescription';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const patientId = searchParams.get('patientId');

    let query: any = {};
    if (patientId) {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { patientId, patientName, phone, age, diagnosis, vitals, medicines, notes, followUpDate } = body;
    
    if (!patientName || !phone || !age || !diagnosis || !medicines) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPrescription = new Prescription({
      patientId: patientId || undefined,
      patientName,
      phone,
      age,
      diagnosis,
      vitals,
      medicines,
      notes,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    await newPrescription.save();
    return NextResponse.json(newPrescription, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
