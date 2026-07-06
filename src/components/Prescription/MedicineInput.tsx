'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { IPrescribedMedicine } from '@/models/Prescription';

interface MedicineInputProps {
  medicine: IPrescribedMedicine;
  index: number;
  onChange: (index: number, updatedMedicine: IPrescribedMedicine) => void;
  onRemove: (index: number) => void;
}

const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'HS'];
const DURATION_OPTIONS = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month'];

export default function MedicineInput({ medicine, index, onChange, onRemove }: MedicineInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Ref for the wrapper to handle outside clicks
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Debounced search for medicines
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isFocused && medicine.name.length >= 2) {
        fetch(`/api/medicines?q=${medicine.name}`)
          .then((res) => res.json())
          .then((data) => {
            setSuggestions(data);
            setShowSuggestions(true);
          })
          .catch((err) => console.error(err));
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [medicine.name, isFocused]);

  const handleChange = (field: keyof IPrescribedMedicine, value: string) => {
    onChange(index, { ...medicine, [field]: value });
  };

  const handleSelectSuggestion = (suggestion: any) => {
    onChange(index, {
      ...medicine,
      name: suggestion.name,
      dosage: suggestion.typicalDosage || medicine.dosage,
      frequency: suggestion.typicalFrequency || medicine.frequency,
    });
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 relative">
      <div className="w-full md:w-2/6 relative" ref={wrapperRef}>
        <label className="block text-xs text-gray-500 mb-1">Medicine Name</label>
        <input
          type="text"
          value={medicine.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 transition-colors"
          placeholder="e.g. Paracetamol"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 top-full left-0 w-full bg-white shadow-lg border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={s._id}
                onClick={() => handleSelectSuggestion(s)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              >
                <div className="font-medium">{s.name}</div>
                {s.typicalDosage && <div className="text-xs text-gray-500">{s.typicalDosage} {s.typicalFrequency}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full md:w-1/6">
        <label className="block text-xs text-gray-500 mb-1">Dosage</label>
        <input
          type="text"
          value={medicine.dosage}
          onChange={(e) => handleChange('dosage', e.target.value)}
          className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 transition-colors"
          placeholder="e.g. 500mg"
        />
      </div>

      <div className="w-full md:w-1/6">
        <label className="block text-xs text-gray-500 mb-1">Frequency</label>
        <select
          value={medicine.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent transition-colors cursor-pointer"
        >
          <option value="">Select...</option>
          {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="w-full md:w-1/6">
        <label className="block text-xs text-gray-500 mb-1">Duration</label>
        <input
          type="text"
          list={`duration-opts-${index}`}
          value={medicine.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
          className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 transition-colors"
          placeholder="e.g. 5 days"
        />
        <datalist id={`duration-opts-${index}`}>
          {DURATION_OPTIONS.map(opt => <option key={opt} value={opt} />)}
        </datalist>
      </div>

      <div className="w-full md:w-1/6">
        <label className="block text-xs text-gray-500 mb-1">Instructions</label>
        <input
          type="text"
          value={medicine.instructions || ''}
          onChange={(e) => handleChange('instructions', e.target.value)}
          className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 transition-colors"
          placeholder="e.g. After meals"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mt-5 md:mt-4 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
        title="Remove Medicine"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
