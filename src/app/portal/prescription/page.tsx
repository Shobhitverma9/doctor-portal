'use client';

import React, { useState } from 'react';
import { PlusCircle, FileText, CheckCircle2, UserCircle2, Stethoscope, FilePlus, Activity, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PatientSelector from '@/components/Prescription/PatientSelector';
import MedicineInput from '@/components/Prescription/MedicineInput';
import SmartSuggestions from '@/components/Prescription/SmartSuggestions';
import PrescriptionPreview from '@/components/Prescription/PrescriptionPreview';
import { IPrescribedMedicine } from '@/models/Prescription';
import toast, { Toaster } from 'react-hot-toast';

export default function PrescriptionCreatorPage() {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<IPrescribedMedicine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  
  const [showVitals, setShowVitals] = useState(false);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    sugar: '',
    pulse: '',
    temperature: '',
    weight: ''
  });
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);

  const handlePatientSelect = (patient: any) => {
    setPatientId(patient._id || '');
    setPatientName(patient.patientName);
    setPhone(patient.phone);
    setAge(patient.age);
    toast.success('Patient details autofilled');
  };

  const addEmptyMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const handleMedicineChange = (index: number, updatedMedicine: IPrescribedMedicine) => {
    const newMedicines = [...medicines];
    newMedicines[index] = updatedMedicine;
    setMedicines(newMedicines);
  };

  const removeMedicine = (index: number) => {
    const newMedicines = [...medicines];
    newMedicines.splice(index, 1);
    setMedicines(newMedicines);
  };

  const handleAddSuggestedMedicine = (medicine: IPrescribedMedicine) => {
    setMedicines([...medicines, medicine]);
    toast.success('Medicine added from suggestions');
  };

  const savePrescription = async () => {
    if (!patientName || !diagnosis || medicines.length === 0) {
      toast.error('Please fill patient details, diagnosis, and at least one medicine.');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          phone,
          age,
          diagnosis,
          vitals: Object.values(vitals).some(v => v !== '') ? vitals : undefined,
          medicines,
          notes,
          followUpDate
        })
      });
      
      if (res.ok) {
        toast.success('Prescription saved successfully!');
      } else {
        toast.error('Failed to save prescription');
      }
    } catch (e) {
      toast.error('Error saving prescription');
    }
    setIsSaving(false);
  };

  const sendWhatsapp = async () => {
    if (!phone) {
      toast.error('Patient phone number is missing');
      return;
    }
    
    setIsSendingWhatsapp(true);
    try {
      const res = await fetch('/api/whatsapp/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          patientName,
          diagnosis,
          medicines,
          notes,
          followUpDate
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('Sent to WhatsApp successfully!');
      } else {
        toast.error(data.error || 'Failed to send WhatsApp message');
      }
    } catch (e) {
      toast.error('Error sending WhatsApp message');
    }
    setIsSendingWhatsapp(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Navigation */}
        <div className="mb-2">
          <Link href="/portal" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FilePlus className="w-6 h-6 mr-2 text-blue-600" />
              Prescription Creator
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage prescriptions seamlessly.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={savePrescription}
              disabled={isSaving}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition flex items-center"
            >
              {isSaving ? 'Saving...' : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save Draft</>}
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview & Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Patient Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UserCircle2 className="w-5 h-5 mr-2 text-blue-500" />
                Patient Details
              </h2>
              <div className="mb-6">
                <PatientSelector onSelect={handlePatientSelect} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Vitals & Reports (Optional) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowVitals(!showVitals)}
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-500" />
                  Vitals & Test Reports <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                </h2>
                <div className="text-gray-400">
                  {showVitals ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
              
              {showVitals && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                      placeholder="e.g. 120/80"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Sugar</label>
                    <input
                      type="text"
                      value={vitals.sugar}
                      onChange={(e) => setVitals({...vitals, sugar: e.target.value})}
                      placeholder="e.g. 110 mg/dL"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                    <input
                      type="text"
                      value={vitals.temperature}
                      onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                      placeholder="e.g. 98.6 F"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pulse Rate</label>
                    <input
                      type="text"
                      value={vitals.pulse}
                      onChange={(e) => setVitals({...vitals, pulse: e.target.value})}
                      placeholder="e.g. 72 bpm"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                    <input
                      type="text"
                      value={vitals.weight}
                      onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                      placeholder="e.g. 70 kg"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-500" />
                Diagnosis & Clinical Notes
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Diagnosis & Notes</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  placeholder="e.g. Viral Fever, Hypertension..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Medicines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="text-2xl mr-2 text-blue-600 font-serif">℞</span>
                  Medicines
                </h2>
              </div>
              
              <div className="space-y-4">
                {medicines.map((med, idx) => (
                  <MedicineInput
                    key={idx}
                    index={idx}
                    medicine={med}
                    onChange={handleMedicineChange}
                    onRemove={removeMedicine}
                  />
                ))}
                
                {medicines.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No medicines added yet.</p>
                  </div>
                )}

                <button
                  onClick={addEmptyMedicine}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-blue-500" />
                  Add Medicine
                </button>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Advice / Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional instructions for the patient..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm max-w-xs block"
                />
              </div>
            </div>

          </div>

          {/* Sidebar / Smart Suggestions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <SmartSuggestions 
                diagnosis={diagnosis} 
                onAddMedicine={handleAddSuggestedMedicine} 
              />
            </div>
          </div>

        </div>
      </div>

      {showPreview && (
        <PrescriptionPreview
          patientName={patientName}
          age={age}
          phone={phone}
          diagnosis={diagnosis}
          vitals={Object.values(vitals).some(v => v !== '') ? vitals : undefined}
          medicines={medicines}
          notes={notes}
          followUpDate={followUpDate}
          onClose={() => setShowPreview(false)}
          onSendWhatsapp={sendWhatsapp}
          isSendingWhatsapp={isSendingWhatsapp}
        />
      )}
    </div>
  );
}
