'use client';

import React, { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';

interface Patient {
  _id: string;
  patientName: string;
  phone: string;
  age: string;
}

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
}

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments?limit=100');
      if (res.ok) {
        const data = await res.json();
        // deduplicate by phone just in case to show unique patients
        const unique = Array.from(new Map((data.data || []).map((item: any) => [item.phone, item])).values()) as Patient[];
        setPatients(unique);
      }
    } catch (e) {
      console.error('Failed to fetch patients', e);
    }
    setLoading(false);
  };

  const filtered = patients.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          placeholder="Search and select patient (Name or Phone)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {loading ? (
            <div className="px-4 py-2 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No patients found.</div>
          ) : (
            filtered.map((patient) => (
              <div
                key={patient._id || patient.phone}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent focus loss
                  onSelect(patient);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="block truncate font-medium">
                    {patient.patientName}
                  </span>
                  <span className="ml-2 truncate text-gray-500">
                    ({patient.age} yrs) - {patient.phone}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
