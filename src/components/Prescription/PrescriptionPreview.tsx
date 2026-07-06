'use client';

import React, { useState } from 'react';
import { IPrescribedMedicine } from '@/models/Prescription';
import { Printer, X, Send, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface PrescriptionPreviewProps {
  patientName: string;
  age: string;
  phone: string;
  diagnosis: string;
  medicines: IPrescribedMedicine[];
  notes?: string;
  followUpDate?: string;
  doctorName?: string;
  clinicName?: string;
  onClose: () => void;
  onSendWhatsapp: () => void;
  isSendingWhatsapp: boolean;
}

export default function PrescriptionPreview({
  patientName,
  age,
  phone,
  diagnosis,
  medicines,
  notes,
  followUpDate,
  doctorName = 'Dr. John Doe',
  clinicName = 'City Care Clinic',
  onClose,
  onSendWhatsapp,
  isSendingWhatsapp,
}: PrescriptionPreviewProps) {
  
  const [printWithLetterhead, setPrintWithLetterhead] = useState(true);
  
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-300">
        
        {/* Action Bar - Hidden during print */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 print:hidden z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Prescription Preview</h2>
            <p className="text-sm text-gray-500">Previewing how it looks on the doctor's letterhead.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center mr-4 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <input 
                type="checkbox" 
                id="printLetterhead" 
                checked={printWithLetterhead}
                onChange={(e) => setPrintWithLetterhead(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="printLetterhead" className="ml-2 text-sm text-gray-700 font-medium cursor-pointer select-none">
                Print Background Image
              </label>
            </div>
          
            <button
              onClick={onSendWhatsapp}
              disabled={isSendingWhatsapp}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingWhatsapp ? 'Sending...' : 'WhatsApp'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Area - Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-gray-200 print:bg-white print:p-0 print:block">
          
          {/* A4 Paper Representation */}
          <div 
            id="prescription-print-area"
            className="relative bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] print:w-full print:h-full mx-auto"
            style={{
               // For preview, we show the letterhead if checked. For print, CSS handles it.
            }}
          >
            {/* Letterhead Background Image */}
            <div className={`absolute inset-0 z-0 pointer-events-none ${printWithLetterhead ? 'print:block' : 'print:hidden'}`}>
              {/* Note: In a real scenario, this would be an uploaded image URL from the doctor's settings */}
              <Image 
                src="/sample_letterhead.svg" 
                alt="Letterhead" 
                fill 
                className="object-cover object-top opacity-100"
                priority
              />
            </div>

            {/* Content Container - Placed over the letterhead with appropriate margins */}
            <div className="relative z-10 pt-[220px] pb-[150px] px-12 print:pt-[220px] print:pb-[150px] h-full flex flex-col">
              
              {/* Patient Details - Styled to look formal on letterhead */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 border-b-2 border-gray-300 pb-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Patient Name</p>
                  <p className="text-sm font-bold text-gray-900">{patientName || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Age</p>
                  <p className="text-sm font-bold text-gray-900">{age ? `${age} Yrs` : '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Phone</p>
                  <p className="text-sm font-bold text-gray-900">{phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Date</p>
                  <p className="text-sm font-bold text-gray-900">{currentDate}</p>
                </div>
              </div>

              {/* Diagnosis */}
              {diagnosis && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Diagnosis</h3>
                  <p className="text-gray-900 font-medium text-sm whitespace-pre-wrap">{diagnosis}</p>
                </div>
              )}

              {/* Rx Section */}
              <div className="mb-8 flex-grow">
                <h3 className="text-3xl font-serif font-bold text-blue-800 mb-4 flex items-center">
                  ℞
                </h3>
                
                {medicines.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">No medicines prescribed.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-800 text-gray-800 text-xs uppercase tracking-wider">
                        <th className="py-2 font-bold w-1/3">Medicine</th>
                        <th className="py-2 font-bold w-1/6">Dosage</th>
                        <th className="py-2 font-bold w-1/6">Freq</th>
                        <th className="py-2 font-bold w-1/6">Duration</th>
                        <th className="py-2 font-bold w-1/4">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {medicines.map((med, idx) => (
                        <tr key={idx} className="text-gray-900 text-sm">
                          <td className="py-3 font-bold">{med.name}</td>
                          <td className="py-3 font-medium">{med.dosage || '-'}</td>
                          <td className="py-3 font-medium">{med.frequency}</td>
                          <td className="py-3 font-medium">{med.duration}</td>
                          <td className="py-3 text-sm text-gray-700 italic">{med.instructions || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Notes & Follow-up */}
              <div className="grid grid-cols-2 gap-8 mt-auto mb-16">
                <div>
                  {notes && (
                    <>
                      <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Advice / Notes</h3>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm font-medium">{notes}</p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {followUpDate && (
                    <>
                      <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Follow up on</h3>
                      <p className="text-gray-900 font-bold text-lg">{new Date(followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Digital Signature Notice (Positioned above the visual footer of the letterhead) */}
              <div className="text-center pb-4 mt-8">
                 <p className="text-[10px] text-gray-500 italic">This prescription is digitally generated by Doctor Portal.</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-print-area, #prescription-print-area * {
            visibility: visible;
          }
          #prescription-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background: white !important;
            box-shadow: none !important;
          }
          
          /* Webkit specific print background rendering */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
