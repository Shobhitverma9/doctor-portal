import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'bookings.json');

const initDataStore = () => {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ bookedSlots: [] }));
  }
};

export async function GET() {
  try {
    initDataStore();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ bookedSlots: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDataStore();
    const { slotTime } = await request.json();
    
    if (!slotTime) {
      return NextResponse.json({ error: 'Slot time is required' }, { status: 400 });
    }

    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    if (data.bookedSlots.includes(slotTime)) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
    }

    data.bookedSlots.push(slotTime);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, bookedSlots: data.bookedSlots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to book slot' }, { status: 500 });
  }
}
