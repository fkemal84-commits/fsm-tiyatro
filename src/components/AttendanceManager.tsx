'use client';

import { useState, useEffect } from 'react';
import { finalizeAttendance, startPulseCheck } from '@/app/actions';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
  surname: string;
  role: string;
}

type AttendanceStatus = 'GELDİ' | 'MAZERETLİ' | 'GEÇ' | 'GELMEDİ';

export default function AttendanceManager({ 
  rehearsalId, 
  allUsers, 
  initialAttendance,
  initialNotes,
  pulseResponses: initialPulseResponses = []
}: { 
  rehearsalId: string, 
  allUsers: User[], 
  initialAttendance: Record<string, AttendanceStatus>,
  initialNotes?: string,
  pulseResponses?: string[]
}) {
  const [pulseResponses, setPulseResponses] = useState<string[]>(initialPulseResponses);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance || {});
  
  // Eğer pulseResponses varsa ve attendance boşsa, otomatik olarak GELDİ işaretle
  useEffect(() => {
    if (pulseResponses.length > 0) {
      setAttendance(prev => {
        const next = { ...prev };
        pulseResponses.forEach(uid => {
          if (!next[uid]) next[uid] = 'GELDİ';
        });
        return next;
      });
    }
  }, [pulseResponses]);

  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseTimeLeft, setPulseTimeLeft] = useState(0);

  // Firestore'dan canlı Nabız Yoklama verilerini dinle
  useEffect(() => {
    if (!open) return;
    
    const unsubscribe = onSnapshot(doc(db, "rehearsals", rehearsalId), (doc) => {
      const data = doc.data();
      if (data) {
        const responses = data.pulseResponses || [];
        setPulseResponses(responses); // Canlı listeyi güncelle
        
        if (data.pulseActive) {
          setPulseActive(true);
          const remaining = Math.max(0, Math.floor((data.pulseExpiresAt - Date.now()) / 1000));
          setPulseTimeLeft(remaining);

          // Otomatik "Buradayım" diyenleri GELDİ olarak işaretle
          setAttendance(prev => {
            const next = { ...prev };
            responses.forEach((uid: string) => {
              if (!next[uid]) next[uid] = 'GELDİ';
            });
            return next;
          });
        } else {
          setPulseActive(false);
          setPulseTimeLeft(0);
        }
      }
    });

    return () => unsubscribe();
  }, [open, rehearsalId]);

  const handleStartPulse = async () => {
    setLoading(true);
    await startPulseCheck(rehearsalId);
    setLoading(false);
  };

  const setStatus = (userId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [userId]: prev[userId] === status ? 'GELMEDİ' : status
    }));
  };

  const save = async () => {
    setLoading(true);
    await finalizeAttendance(rehearsalId, attendance, notes);
    setLoading(false);
    setOpen(false);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'GELDİ': return 'bg-[#22c55e] text-white';
      case 'MAZERETLİ': return 'bg-[#3b82f6] text-white';
      case 'GEÇ': return 'bg-[#eab308] text-black';
      case 'GELMEDİ': return 'bg-white/10 text-white/40';
      default: return 'bg-white/5 text-white/20';
    }
  };

  return (
    <div className="mt-4">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold text-[var(--primary-gold)] hover:text-white transition-all bg-white/5 py-3 px-6 rounded-full border border-[var(--primary-gold)]/20"
      >
        <ion-icon name={open ? 'chevron-up-outline' : 'people-outline'}></ion-icon>
        {open ? 'YOKLAMA PANELİNİ KAPAT' : 'YOKLAMA VE NABIZ YÖNETİMİ'}
      </button>

      {open && (
        <div className="mt-4 p-5 bg-black/80 rounded-3xl border border-[var(--primary-gold)]/30 animate-fadeIn space-y-6">
          
          {/* Nabız Yoklama Bölümü */}
          <div className="p-4 bg-[var(--primary-gold-dim)]/20 rounded-2xl border border-[var(--primary-gold)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-[var(--primary-gold)] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                Nabız Yoklaması (Flash)
              </h3>
              <p className="text-white/40 text-[10px] mt-1">30 sn. içinde oyuncuların cihazlarından onay toplar.</p>
            </div>
            
            {pulseActive ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--primary-gold)] flex items-center justify-center text-xl font-bold text-[var(--primary-gold)]">
                  {pulseTimeLeft}
                </div>
                <span className="text-[var(--primary-gold)] font-bold text-xs animate-pulse">TOPLANIYOR...</span>
              </div>
            ) : (
              <button 
                onClick={handleStartPulse}
                disabled={loading}
                className="btn btn-primary !py-2 !px-6 !rounded-full !text-[10px]"
              >
                YENİ NABIZ BAŞLAT
              </button>
            )}
          </div>

          {/* Oyuncu Listesi */}
          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {allUsers.map((u) => {
              const currentStatus = attendance[u.id] || 'GELMEDİ';
              return (
                <div key={u.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(currentStatus)}`}>
                        {u.name[0]}{u.surname[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-white font-bold">{u.name} {u.surname}</p>
                          {pulseResponses.includes(u.id) && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-[var(--primary-gold)] bg-[var(--primary-gold)]/10 px-1.5 py-0.5 rounded border border-[var(--primary-gold)]/20 animate-fadeIn">
                              <ion-icon name="shield-checkmark-outline"></ion-icon>
                              NABIZ ONAYLI
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Seçiciler */}
                  <div className="grid grid-cols-4 gap-2">
                    {(['GELDİ', 'MAZERETLİ', 'GEÇ', 'GELMEDİ'] as AttendanceStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(u.id, s)}
                        className={`py-2 px-1 rounded-lg text-[8px] font-bold transition-all border ${
                          currentStatus === s 
                          ? s === 'GELDİ' ? 'bg-[#22c55e] border-[#22c55e] text-white' :
                            s === 'MAZERETLİ' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' :
                            s === 'GEÇ' ? 'bg-[#eab308] border-[#eab308] text-black' :
                            'bg-white/20 border-white/30 text-white'
                          : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Yönetmen Notu */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-widest px-2">Yönetmen Notu (Opsiyonel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bugünkü prova disiplini, eksikler veya genel performans hakkında notunuz..."
              className="w-full p-4 bg-black/40 rounded-2xl border border-white/10 text-white text-xs focus:border-[var(--primary-gold)] transition-all outline-none min-h-[100px]"
            />
          </div>

          <button 
            onClick={save}
            disabled={loading}
            className="w-full btn btn-primary py-4 rounded-2xl font-bold tracking-widest text-xs shadow-glow"
          >
            {loading ? 'KAYDEDİLİYOR...' : 'YOKLAMAYI VE NOTLARI MÜHÜRLE'}
          </button>
        </div>
      )}
    </div>
  );
}
