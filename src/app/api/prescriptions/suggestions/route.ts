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

    // Split diagnosis by common delimiters
    const keywords = diagnosis
      .split(/[,+&]|\band\b/i)
      .map(k => k.trim())
      .filter(k => k.length >= 3);

    if (keywords.length === 0) {
      return NextResponse.json([]);
    }

    const groupedSuggestions = [];

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'i');
      
      // Find past prescriptions with similar diagnosis
      const prescriptions = await Prescription.find({ diagnosis: regex }).limit(50).lean();
      
      if (prescriptions.length === 0) continue;

      const totalMatches = prescriptions.length;
      
      // Aggregate medicines
      const medicineCounts: Record<string, { count: number; typicalDosage: string; typicalFrequency: string; typicalDuration: string; name: string }> = {};

      prescriptions.forEach((p: any) => {
        p.medicines.forEach((m: any) => {
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

      groupedSuggestions.push({
        keyword,
        suggestions: suggestions.slice(0, 5) // Top 5 suggestions per keyword
      });
    }

    return NextResponse.json(groupedSuggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
