import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Prescription } from '@/models/Prescription';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const diagnosis = searchParams.get('diagnosis');

    if (!diagnosis || diagnosis.trim().length < 3) {
      return NextResponse.json([]); // Not enough text to suggest
    }

    // Basic text search. A full text search requires text index which we added on 'diagnosis'
    // But since it can be partial, regex might be more forgiving for auto-complete style
    // Wait, text search is better for complete words. Let's use regex for partial matching
    const regex = new RegExp(diagnosis, 'i');
    
    // Find past prescriptions with similar diagnosis
    const prescriptions = await Prescription.find({ diagnosis: regex }).limit(50);
    
    if (prescriptions.length === 0) {
      return NextResponse.json([]);
    }

    const totalMatches = prescriptions.length;
    
    // Aggregate medicines
    const medicineCounts: Record<string, { count: number; typicalDosage: string; typicalFrequency: string; typicalDuration: string; name: string }> = {};

    prescriptions.forEach(p => {
      p.medicines.forEach(m => {
        const key = m.name.toLowerCase();
        if (!medicineCounts[key]) {
          medicineCounts[key] = {
            name: m.name,
            count: 0,
            typicalDosage: m.dosage,
            typicalFrequency: m.frequency,
            typicalDuration: m.duration,
          };
        }
        medicineCounts[key].count++;
      });
    });

    // Calculate match percentage and sort
    const suggestions = Object.values(medicineCounts).map(m => {
      const matchPercentage = Math.round((m.count / totalMatches) * 100);
      return {
        ...m,
        matchPercentage
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json(suggestions.slice(0, 10)); // Top 10 suggestions
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
