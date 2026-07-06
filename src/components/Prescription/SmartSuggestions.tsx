'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, PlusCircle, Activity } from 'lucide-react';
import { IPrescribedMedicine } from '@/models/Prescription';

interface SmartSuggestionsProps {
  diagnosis: string;
  onAddMedicine: (medicine: IPrescribedMedicine) => void;
}

export default function SmartSuggestions({ diagnosis, onAddMedicine }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (diagnosis && diagnosis.trim().length >= 3) {
        fetchSuggestions(diagnosis);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [diagnosis]);

  const fetchSuggestions = async (diag: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prescriptions/suggestions?diagnosis=${encodeURIComponent(diag)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.error('Failed to fetch suggestions', e);
    }
    setLoading(false);
  };

  if (!diagnosis || diagnosis.trim().length < 3) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex items-start">
        <Lightbulb className="w-5 h-5 mr-2 flex-shrink-0" />
        <p>Type a diagnosis (min 3 chars) to see smart medicine suggestions based on previous prescriptions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-blue-500" />
          Smart Suggestions for &quot;{diagnosis}&quot;
        </h3>
        {loading && <span className="text-xs text-gray-500 animate-pulse">Analyzing...</span>}
      </div>

      <div className="p-0">
        {suggestions.length === 0 && !loading ? (
          <div className="p-4 text-sm text-gray-500 text-center">No previous data found for this diagnosis.</div>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <li key={idx} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {s.matchPercentage}% Match
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.typicalDosage || 'Dosage N/A'} • {s.typicalFrequency || 'Frequency N/A'} • {s.typicalDuration || 'Duration N/A'}
                  </div>
                </div>
                <button
                  onClick={() => onAddMedicine({
                    name: s.name,
                    dosage: s.typicalDosage || '',
                    frequency: s.typicalFrequency || '',
                    duration: s.typicalDuration || '',
                    instructions: ''
                  })}
                  className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
