'use client';

import React, { useState, useEffect } from 'react';
import styles from './Portal.module.css';
import { Calendar, Users, Settings, Clock, CheckCircle, LogOut, BarChart, MessageCircle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const PortalDashboard = ({ role }: { role?: string }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState('recent-visit');

  const [waStatus, setWaStatus] = useState<any>({ status: 'disconnected', qrCode: null, user: null });

  useEffect(() => {
    fetchAppointments();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWaStatus();
      const interval = setInterval(fetchWaStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchWaStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.data);
      }
    } catch (e) {}
  };

  const connectWhatsApp = async () => {
    await fetch('/api/whatsapp/connect', { method: 'POST' });
    fetchWaStatus();
  };

  const disconnectWhatsApp = async () => {
    await fetch('/api/whatsapp/logout', { method: 'POST' });
    fetchWaStatus();
  };

  const fetchAppointments = async () => {
    const res = await fetch('/api/appointments');
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.data || []);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        setClosedDates(data.data.closedDates || []);
        setClosedDays(data.data.closedDaysOfWeek || []);
      }
    }
  };

  const updateApptStatus = async (id: string, status: string, summary?: string, followupDate?: string) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, summary, followupDate })
    });
    if (res.ok) {
      fetchAppointments();
      setIsApptModalOpen(false);
    }
  };

  const updateSettings = async (newClosedDays: number[], newClosedDates: string[]) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closedDaysOfWeek: newClosedDays, closedDates: newClosedDates })
    });
    if (res.ok) {
      alert("Settings saved successfully.");
      fetchSettings();
    }
  };

  const toggleDay = (day: number) => {
    const newDays = closedDays.includes(day) 
      ? closedDays.filter(d => d !== day) 
      : [...closedDays, day];
    setClosedDays(newDays);
  };

  const handleDateAdd = (e: any) => {
    e.preventDefault();
    const date = e.target.date.value;
    if (date && !closedDates.includes(date)) {
      setClosedDates([...closedDates, date]);
    }
    e.target.reset();
  };

  const removeDate = (date: string) => {
    setClosedDates(closedDates.filter(d => d !== date));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/portal/login');
  };

  const saveSettings = () => {
    const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement;
    let currentDates = closedDates;
    if (dateInput && dateInput.value) {
      if (!currentDates.includes(dateInput.value)) {
        currentDates = [...currentDates, dateInput.value];
        setClosedDates(currentDates);
      }
      dateInput.value = '';
    }
    updateSettings(closedDays, currentDates);
  };

  const renderAppointments = () => {
    const pending = appointments.filter(a => a.status === 'pending');
    const open = appointments.filter(a => a.status === 'open');
    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled');

    const Column = ({ title, items, status }: { title: string, items: any[], status: string }) => (
      <div className={styles.kanbanColumn}>
        <div className={styles.columnHeader}>
          {title} <span className={styles.countBadge}>{items.length}</span>
        </div>
        {items.map(appt => (
          <div 
            key={appt._id} 
            className={styles.appointmentCard}
            onClick={() => { setSelectedAppt(appt); setIsApptModalOpen(true); }}
          >
            <h4 className={styles.patientName}>{appt.patientName}</h4>
            <p className={styles.appointmentTime}><Clock size={14}/> {appt.date} • {appt.timeSlot}</p>
            {appt.problem && <p className={styles.appointmentProblem}>{appt.problem}</p>}
          </div>
        ))}
      </div>
    );

    return (
      <div className={styles.kanbanBoard}>
        <Column title="Pending Confirmation" items={pending} status="pending" />
        <Column title="Upcoming" items={open} status="open" />
        <Column title="Completed" items={completed} status="completed" />
        <Column title="Cancelled" items={cancelled} status="cancelled" />
      </div>
    );
  };

  const renderSettings = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <div>
        <div className={styles.settingsCard}>
          <h3>Closed Days of the Week</h3>
          <p style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem'}}>
            Select the days you do not accept appointments.
          </p>
          <div className={styles.checkboxGrid}>
            {days.map((day, idx) => (
              <label key={idx} className={styles.checkboxItem}>
                <input 
                  type="checkbox" 
                  checked={closedDays.includes(idx)} 
                  onChange={() => toggleDay(idx)} 
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.settingsCard}>
          <h3>Specific Closed Dates</h3>
          <p style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem'}}>
            Add specific dates (like holidays) when you are unavailable.
          </p>
          <form onSubmit={handleDateAdd} style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
            <input type="date" name="date" required style={{padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1'}} />
            <button type="submit" className={styles.btnSecondary}>Add Date</button>
          </form>
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            {closedDates.map(date => (
              <span key={date} style={{padding: '0.25rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                {date} 
                <button onClick={() => removeDate(date)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>&times;</button>
              </span>
            ))}
          </div>
        </div>

        <button onClick={saveSettings} className={styles.btnPrimary}>Save Availability Settings</button>
      </div>
    );
  };

  const renderAnalytics = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Metrics calculations
    const visitsToday = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const upcomingFollowups = appointments.filter(a => a.followupDate && a.followupDate >= todayStr).length;
    const uniquePatients = new Set(appointments.map(a => a.phone)).size;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className={styles.settingsCard} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem' }}>{visitsToday}</div>
          <div style={{ color: '#64748b', fontWeight: 500 }}>Visits Today</div>
        </div>
        <div className={styles.settingsCard} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>{pendingCount}</div>
          <div style={{ color: '#64748b', fontWeight: 500 }}>Pending Confirmations</div>
        </div>
        <div className={styles.settingsCard} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>{upcomingFollowups}</div>
          <div style={{ color: '#64748b', fontWeight: 500 }}>Upcoming Follow-ups</div>
        </div>
        <div className={styles.settingsCard} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '0.5rem' }}>{uniquePatients}</div>
          <div style={{ color: '#64748b', fontWeight: 500 }}>Total Unique Patients</div>
        </div>
      </div>
    );
  };

  const renderPatients = () => {
    const patientMap = new Map();
    appointments.forEach(a => {
      if (!patientMap.has(a.phone)) {
        patientMap.set(a.phone, {
          name: a.patientName,
          phone: a.phone,
          email: a.email,
          age: a.age,
          appointments: [],
          lastVisit: a.date
        });
      }
      const p = patientMap.get(a.phone);
      p.appointments.push(a);
      if (new Date(a.date) > new Date(p.lastVisit)) {
        p.lastVisit = a.date;
      }
    });

    let patients = Array.from(patientMap.values());

    // Apply Search
    if (patientSearchQuery) {
      const q = patientSearchQuery.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.phone.includes(q) || 
        p.email.toLowerCase().includes(q)
      );
    }

    // Apply Filter / Sort
    if (patientFilter === 'recent-visit') {
      patients.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    } else if (patientFilter === 'most-visits') {
      patients.sort((a, b) => b.appointments.length - a.appointments.length);
    } else if (patientFilter === 'upcoming-followup') {
      const todayStr = new Date().toISOString().split('T')[0];
      patients = patients.filter(p => 
        p.appointments.some((a: any) => a.followupDate && a.followupDate >= todayStr)
      );
    }

    return (
      <div className={styles.settingsCard}>
        <h3 style={{ marginBottom: '1.5rem' }}>Patient Database</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            value={patientSearchQuery}
            onChange={(e) => setPatientSearchQuery(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: '1', minWidth: '250px' }}
          />
          <select 
            value={patientFilter} 
            onChange={(e) => setPatientFilter(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '200px' }}
          >
            <option value="recent-visit">Sort by: Most Recent Visit</option>
            <option value="most-visits">Sort by: Total Visits (High to Low)</option>
            <option value="upcoming-followup">Filter: Has Upcoming Follow-up</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '1rem' }}>Patient Name</th>
                <th style={{ padding: '1rem' }}>Contact</th>
                <th style={{ padding: '1rem' }}>Total Visits</th>
                <th style={{ padding: '1rem' }}>Last Visit</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p.phone} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', fontWeight: 500, color: '#0f172a' }}>{p.name} <br/><span style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 400}}>{p.age} yrs</span></td>
                  <td style={{ padding: '1rem', color: '#334155' }}>{p.phone}<br/><span style={{fontSize:'0.75rem', color:'#64748b'}}>{p.email}</span></td>
                  <td style={{ padding: '1rem', color: '#334155' }}>{p.appointments.length}</td>
                  <td style={{ padding: '1rem', color: '#334155' }}>{p.lastVisit}</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => { setSelectedPatient(p); setIsPatientModalOpen(true); }}
                      style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWhatsApp = () => {
    return (
      <div className={styles.settingsCard}>
        <h3>WhatsApp Integration</h3>
        <p style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem'}}>
          Link your WhatsApp account to enable automatic appointment confirmations and follow-up reminders.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {waStatus.status === 'connected' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={32} />
              </div>
              <h4 style={{ color: '#0f172a', margin: '0 0 0.5rem' }}>WhatsApp is Connected</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Linked Number: {waStatus.user?.id?.split(':')[0]}
              </p>
              <button onClick={disconnectWhatsApp} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Disconnect WhatsApp
              </button>
            </div>
          ) : waStatus.status === 'connecting' ? (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#0f172a', margin: '0 0 1rem' }}>Waiting for QR Scan...</h4>
              {waStatus.qrCode ? (
                <div>
                  <img src={waStatus.qrCode} alt="WhatsApp QR Code" style={{ width: '100%', maxWidth: '350px', border: '10px solid white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Open WhatsApp on your phone, go to Linked Devices, and scan this QR code to connect.
                  </p>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Generating QR code...</p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <MessageCircle size={32} />
              </div>
              <h4 style={{ color: '#0f172a', margin: '0 0 0.5rem' }}>WhatsApp is Disconnected</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '300px' }}>
                Connect your WhatsApp to automate patient communication.
              </p>
              <button onClick={connectWhatsApp} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Connect WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.portalContainer}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <div style={{width: 40, height: 40, background: '#3b82f6', borderRadius: 8, marginRight: 10}}></div>
          </div>
          <h2>Dr. Anand Vihari</h2>
          <p style={{ textTransform: 'capitalize' }}>Welcome, {role || 'Doctor'}</p>
        </div>
        <div className={styles.navMenu}>
          <div 
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart size={18} /> Analytics Dashboard
          </div>
          <div 
            className={styles.navItem}
            onClick={() => router.push('/portal/prescription')}
          >
            <FileText size={18} /> Prescription Creator
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'appointments' ? styles.active : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} /> Appointments
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'patients' ? styles.active : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <Users size={18} /> Patient Database
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} /> Availability Settings
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'whatsapp' ? styles.active : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <MessageCircle size={18} /> WhatsApp Bot
          </div>
        </div>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1>
            {activeTab === 'appointments' ? 'Manage Appointments' : 
             activeTab === 'settings' ? 'Availability Settings' : 
             activeTab === 'whatsapp' ? 'WhatsApp Integration' : 
             activeTab === 'patients' ? 'Patient Database' :
             'Analytics Dashboard'}
          </h1>
        </div>
        
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'patients' && renderPatients()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'whatsapp' && renderWhatsApp()}
      </div>

      {/* Appointment Modal */}
      {isApptModalOpen && selectedAppt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Appointment Details</h3>
              <button className={styles.closeBtn} onClick={() => setIsApptModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Patient Name</span>
                  <p className={styles.infoValue}>{selectedAppt.patientName}</p>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Age</span>
                  <p className={styles.infoValue}>{selectedAppt.age} years</p>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Contact</span>
                  <p className={styles.infoValue}>{selectedAppt.phone}<br/>{selectedAppt.email}</p>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Date & Time</span>
                  <p className={styles.infoValue}>{selectedAppt.date} at {selectedAppt.timeSlot}</p>
                </div>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Problem / Reason</span>
                <p className={styles.infoValue} style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px'}}>
                  {selectedAppt.problem || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Doctor's Summary</span>
                  <textarea 
                    value={selectedAppt.summary || ''}
                    onChange={(e) => setSelectedAppt({...selectedAppt, summary: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px', fontSize: '0.875rem' }}
                    placeholder="Enter patient summary or notes here..."
                  />
                </div>
                
                <div className={styles.infoGroup}>
                  <span className={styles.infoLabel}>Schedule Follow-up Date</span>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Select a date if patient requires a follow-up visit.</p>
                  <input 
                    type="date"
                    value={selectedAppt.followupDate || ''}
                    onChange={(e) => setSelectedAppt({...selectedAppt, followupDate: e.target.value})}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <div className={styles.formGroup} style={{ margin: 0, width: '45%' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Change Status</label>
                  <select 
                    value={selectedAppt.status} 
                    onChange={(e) => setSelectedAppt({...selectedAppt, status: e.target.value})}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                  >
                    <option value="pending">Pending Confirmation</option>
                    <option value="open">Upcoming / Open</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <button 
                  onClick={() => updateApptStatus(selectedAppt._id, selectedAppt.status, selectedAppt.summary, selectedAppt.followupDate)}
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-end' }}
                >
                  Save Record
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Patient Record Modal */}
      {isPatientModalOpen && selectedPatient && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h3>Patient Record: {selectedPatient.name}</h3>
              <button className={styles.closeBtn} onClick={() => setIsPatientModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.875rem' }}>Phone</p>
                  <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{selectedPatient.phone}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.875rem' }}>Email</p>
                  <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{selectedPatient.email}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.875rem' }}>Age</p>
                  <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{selectedPatient.age} years</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.875rem' }}>Total Visits</p>
                  <p style={{ margin: 0, fontWeight: 500, color: '#0f172a' }}>{selectedPatient.appointments.length}</p>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', color: '#334155' }}>Visit History & Summaries</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {selectedPatient.appointments.map((appt: any, idx: number) => (
                  <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#0f172a' }}>{appt.date} ({appt.timeSlot})</strong>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: appt.status === 'completed' ? '#dcfce7' : appt.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: appt.status === 'completed' ? '#166534' : appt.status === 'cancelled' ? '#991b1b' : '#92400e',
                        textTransform: 'capitalize'
                      }}>
                        {appt.status}
                      </span>
                    </div>
                    {appt.problem && (
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>Reason:</strong> {appt.problem}
                      </p>
                    )}
                    {appt.summary ? (
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', borderLeft: '3px solid #3b82f6' }}>
                        <strong>Doctor's Summary:</strong><br/>
                        {appt.summary}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>No summary added for this visit.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
