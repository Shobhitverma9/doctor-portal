'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, CalendarClock, Hash } from 'lucide-react';

interface Patient {
  _id: string;
  patientId?: string;
  patientName: string;
  phone: string;
  age: string;
  timeSlot?: string;
  date?: string;
  status?: string;
}

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
}

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  const [openAppointments, setOpenAppointments] = useState<Patient[]>([]);
  const [globalPatients, setGlobalPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch recent 200 appointments for local search
      const res = await fetch('/api/appointments?limit=200');
      if (res.ok) {
        const data = await res.json();
        const appointments = data.data || [];
        
        // Filter today's open appointments
        const todayOpen = appointments.filter((a: any) => 
          a.status === 'open' && a.date === today
        );
        
        // Extract unique patients for global search (fallback)
        const unique = Array.from(new Map(appointments.map((item: any) => [item.phone, item])).values()) as Patient[];
        
        setOpenAppointments(todayOpen);
        setGlobalPatients(unique);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
    setLoading(false);
  };

  const filteredGlobal = globalPatients.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.patientId && p.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="Search by Name, Phone, or Patient ID (e.g. PID-1234)..."
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
        <div className="absolute z-20 mt-1 w-full bg-white shadow-xl max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 text-center animate-pulse">Loading patient data...</div>
          ) : (
            <>
              {/* If search is empty, prioritize Today's Open Appointments */}
              {!searchTerm && (
                <div className="mb-2">
                  <div className="bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider px-4 py-2 flex items-center sticky top-0 z-10">
                    <CalendarClock className="w-3 h-3 mr-1" />
                    Today's Open Appointments
                  </div>
                  {openAppointments.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 italic text-xs">No open appointments for today.</div>
                  ) : (
                    openAppointments.map((patient) => (
                      <div
                        key={patient._id}
                        className="cursor-pointer select-none relative py-3 pl-4 pr-4 hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelect(patient);
                          setSearchTerm('');
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="font-semibold text-gray-900">{patient.patientName}</span>
                            <span className="ml-2 text-gray-500 text-xs">({patient.age} yrs) - {patient.phone}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {patient.timeSlot}
                            </span>
                            {patient.patientId && (
                              <span className="text-[10px] text-gray-400 mt-1 flex items-center">
                                <Hash className="w-3 h-3 mr-0.5" />
                                {patient.patientId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Global Search Results (shown if typing or below open appointments) */}
              <div className="border-t border-gray-200">
                <div className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-2 sticky top-0 z-10">
                  Global Patient Search
                </div>
                {filteredGlobal.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 italic text-xs">No matching patients found.</div>
                ) : (
                  filteredGlobal.slice(0, 20).map((patient) => (
                    <div
                      key={patient._id || patient.phone}
                      className="cursor-pointer select-none relative py-3 pl-4 pr-4 hover:bg-gray-100 transition border-b border-gray-50 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(patient);
                        setSearchTerm('');
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-800">{patient.patientName}</span>
                          <span className="ml-2 text-gray-500 text-xs">({patient.age} yrs) - {patient.phone}</span>
                        </div>
                        {patient.patientId && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center">
                            <Hash className="w-3 h-3 mr-0.5" />
                            {patient.patientId}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
