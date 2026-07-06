import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Medicine } from '@/models/Medicine';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (query) {
      // Simple case-insensitive regex search for autocomplete
      const regex = new RegExp(query, 'i');
      let medicines = await Medicine.find({ name: regex }).limit(50).lean();
      
      // Clean names: strip brand prefixes by extracting from the matched word onwards
      const qLower = query.toLowerCase();
      medicines = medicines.map((m: any) => {
         const idx = m.name.toLowerCase().indexOf(qLower);
         if (idx > 0) {
            const lastSpace = m.name.lastIndexOf(' ', idx);
            const startIdx = lastSpace === -1 ? 0 : lastSpace + 1;
            m.name = m.name.substring(startIdx);
         }
         return m;
      });

      // Deduplicate names after trimming
      const uniqueNames = new Set();
      const uniqueMedicines = [];
      for (const m of medicines) {
         if (!uniqueNames.has(m.name)) {
            uniqueNames.add(m.name);
            uniqueMedicines.push(m);
         }
      }

      return NextResponse.json(uniqueMedicines.slice(0, 15));
    } else {
      // If no query, return some popular ones or empty
      const medicines = await Medicine.find().limit(15);
      return NextResponse.json(medicines);
    }
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // For bulk import, accept an array
    if (Array.isArray(body)) {
      const created = await Medicine.insertMany(body, { ordered: false }); // ignore duplicates
      return NextResponse.json(created, { status: 201 });
    }

    const { name, type, typicalDosage, typicalFrequency } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newMedicine = new Medicine({ name, type, typicalDosage, typicalFrequency });
    await newMedicine.save();
    return NextResponse.json(newMedicine, { status: 201 });
  } catch (error: any) {
    // 11000 is duplicate key error in mongodb
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Medicine already exists' }, { status: 400 });
    }
    console.error('Error creating medicine:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
