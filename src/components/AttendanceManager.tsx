'use client';

import { useState, useEffect, useMemo } from 'react';
import { addManualAttendance, finalizeAttendance, startPulseCheck } from '@/app/actions';
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
  pulseResponses?: any[]
}) {
  const [pulseResponses, setPulseResponses] = useState<any[]>(initialPulseResponses);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance || {});
  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseTimeLeft, setPulseTimeLeft] = useState(0);

  // Mazeret Ekleme State'leri
  const [showExcuseForm, setShowExcuseForm] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState('');
  const [excuseNote, setExcuseNote] = useState('');

  // Sadece Aktörleri Filtrele
  const actorsOnly = useMemo(() => 
    allUsers.filter(u => ['AKTOR', 'PLAYER'].includes(u.role)), 
    [allUsers]
  );

  // Gruplandırma Mantığı
  const groups = useMemo(() => {
    const participants: any[] = [];
    const excused: any[] = [];
    const missing: any[] = [];

    allUsers.forEach(u => {
      const status = attendance[u.id] || 'GELMEDİ';
      // pulseResponses içindeki her öğenin tipi farklı olabilir (string veya object)
      const pulseInfo = pulseResponses.find((r: any) => {
        if (!r) return false;
        if (typeof r === 'string') return r === u.id;
        return r.userId === u.id;
      });

      if (status === 'GELDİ' || pulseInfo) {
        participants.push({ 
          ...u, 
          time: (pulseInfo && typeof pulseInfo === 'object') ? pulseInfo.timeString : null 
        });
      } else if (status === 'MAZERETLİ') {
        excused.push(u);
      } else {
        missing.push(u);
      }
    });

    return { participants, excused, missing };
  }, [allUsers, attendance, pulseResponses]);

  // Firestore Dinleyicisi
  useEffect(() => {
    if (!open) return;
    const unsubscribe = onSnapshot(doc(db, "rehearsals", rehearsalId), (doc) => {
      const data = doc.data();
      if (data) {
        // Gelen veriyi güvenli bir şekilde state'e aktar
        setPulseResponses(data.pulseResponses || []);
        
        if (data.pulseActive) {
          setPulseActive(true);
          const remaining = Math.max(0, Math.floor((data.pulseExpiresAt - Date.now()) / 1000));
          setPulseTimeLeft(remaining);
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

  const handleAddExcuse = async () => {
    if (!selectedActorId || !excuseNote) return;
    setLoading(true);
    const res = await addManualAttendance(rehearsalId, selectedActorId, 'MAZERETLİ', excuseNote);
    if (res.success) {
      setAttendance(prev => ({ ...prev, [selectedActorId]: 'MAZERETLİ' }));
      setExcuseNote('');
      setShowExcuseForm(false);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['İsim Soyisim', 'Rol', 'Durum', 'Onay Saati', 'Notlar'];
    const rows = allUsers.map(u => {
      const status = attendance[u.id] || 'GELMEDİ';
      const pulseInfo = pulseResponses.find((r: any) => (typeof r === 'string' ? r === u.id : r.userId === u.id));
      const time = typeof pulseInfo === 'object' ? pulseInfo.timeString : '-';
      return [
        `${u.name} ${u.surname}`,
        u.role,
        status,
        time,
        notes.replace(/\n/g, ' ')
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yoklama_${rehearsalId.slice(-4)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const save = async () => {
    setLoading(true);
    await finalizeAttendance(rehearsalId, attendance, notes);
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs font-bold text-[var(--primary-gold)] hover:text-white transition-all bg-white/5 py-3 px-6 rounded-full border border-[var(--primary-gold)]/20"
        >
          <ion-icon name={open ? 'chevron-up-outline' : 'people-outline'}></ion-icon>
          {open ? 'YOKLAMA PANELİNİ KAPAT' : 'YOKLAMA VE NABIZ YÖNETİMİ'}
        </button>
        {open && (
           <button 
            onClick={exportCSV}
            className="flex items-center gap-2 text-xs font-bold text-[#22c55e] hover:bg-[#22c55e] hover:text-white transition-all bg-[#22c55e]/10 py-3 px-6 rounded-full border border-[#22c55e]/20"
          >
            <ion-icon name="download-outline"></ion-icon>
            EXCEL / CSV OLARAK İNDİR
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 p-5 bg-black/80 rounded-3xl border border-[var(--primary-gold)]/30 animate-fadeIn space-y-6">
          
          {/* Nabız Yoklama Kontrolü */}
          <div className="p-4 bg-[var(--primary-gold-dim)]/20 rounded-2xl border border-[var(--primary-gold)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-[var(--primary-gold)] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                Canlı Nabız Yoklaması
              </h3>
              <p className="text-white/40 text-[10px] mt-1">60 sn. içinde onay toplamaya yarar.</p>
            </div>
            
            {pulseActive ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-gold)] flex items-center justify-center text-sm font-bold text-[var(--primary-gold)]">
                  {pulseTimeLeft}
                </div>
                <span className="text-[var(--primary-gold)] font-bold text-[10px] animate-pulse">SİNYAL AKTİF...</span>
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

          {/* Mazeretli Ekleme Butonu ve Formu */}
          <div className="space-y-3">
            <button 
              onClick={() => setShowExcuseForm(!showExcuseForm)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
            >
              <ion-icon name={showExcuseForm ? 'close-outline' : 'add-outline'}></ion-icon>
              {showExcuseForm ? 'VAZGEÇ' : 'MANUEL MAZERETLİ EKLE'}
            </button>

            {showExcuseForm && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4 animate-fadeIn">
                <select 
                  value={selectedActorId}
                  onChange={(e) => setSelectedActorId(e.target.value)}
                  className="w-full p-3 bg-black/60 rounded-xl border border-white/10 text-white text-xs outline-none focus:border-[var(--primary-gold)]"
                >
                  <option value="">Aktör Seçiniz...</option>
                  {actorsOnly.map(u => (
                    <option key={u.id} value={u.id}>{u.name} {u.surname}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  value={excuseNote}
                  onChange={(e) => setExcuseNote(e.target.value)}
                  placeholder="Mazeret Sebebi... (Örn: Sınavı var, Hastalık)"
                  className="w-full p-3 bg-black/60 rounded-xl border border-white/10 text-white text-xs outline-none focus:border-[var(--primary-gold)]"
                />
                <button 
                  onClick={handleAddExcuse}
                  disabled={loading || !selectedActorId || !excuseNote}
                  className="w-full py-3 bg-[var(--primary-gold)] text-black font-bold text-[10px] uppercase rounded-xl hover:bg-[#b8860b] transition-all disabled:opacity-50"
                >
                  SİSTEME İŞLE
                </button>
              </div>
            )}
          </div>

          {/* GRUPLANDIRILMIŞ LİSTE */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* 1. KATILANLAR */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest flex items-center gap-2 px-1">
                <ion-icon name="checkmark-circle"></ion-icon>
                Katılanlar ({groups.participants.length})
              </h4>
              {groups.participants.map(u => (
                <div key={u.id} className="p-3 bg-[#22c55e]/5 rounded-2xl border border-[#22c55e]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[10px] font-bold">
                      {u.name[0]}{u.surname[0]}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">{u.name} {u.surname}</p>
                      <p className="text-[9px] text-white/40 uppercase">{u.role}</p>
                    </div>
                  </div>
                  {u.time && (
                    <span className="text-[9px] font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded border border-[#22c55e]/10">
                      ONAY: {u.time}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 2. MAZERETLİLER */}
            {groups.excused.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest flex items-center gap-2 px-1">
                  <ion-icon name="information-circle"></ion-icon>
                  Mazeretliler ({groups.excused.length})
                </h4>
                {groups.excused.map(u => (
                  <div key={u.id} className="p-3 bg-[#3b82f6]/5 rounded-2xl border border-[#3b82f6]/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold">
                          {u.name[0]}{u.surname[0]}
                        </div>
                        <p className="text-white text-xs font-bold">{u.name} {u.surname}</p>
                      </div>
                      <button onClick={() => setAttendance(prev => ({ ...prev, [u.id]: 'GELMEDİ' }))} className="text-white/20 hover:text-red-500 transition-colors">
                        <ion-icon name="trash-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. KATILMAYANLAR */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 px-1">
                <ion-icon name="close-circle"></ion-icon>
                Gelmeyenler / Yanıt Yok ({groups.missing.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groups.missing.map(u => (
                  <div key={u.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-[10px] font-bold">
                        {u.name[0]}{u.surname[0]}
                      </div>
                      <p className="text-white/40 text-[11px] font-medium">{u.name} {u.surname}</p>
                    </div>
                    <button 
                      onClick={() => setAttendance(prev => ({ ...prev, [u.id]: 'GELDİ' }))}
                      className="opacity-0 group-hover:opacity-100 bg-[#22c55e] text-white p-1.5 rounded-lg text-xs transition-all"
                      title="Manuel Geldi İşaretle"
                    >
                      <ion-icon name="checkmark-outline"></ion-icon>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Yönetmen Notu */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-widest px-2 flex items-center gap-2">
              <ion-icon name="create-outline"></ion-icon>
              YÖNETMENİN PROVA NOTU
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bugünkü prova disciplini veya performans hakkında notunuz..."
              className="w-full p-4 bg-black/40 rounded-2xl border border-white/10 text-white text-xs focus:border-[var(--primary-gold)] transition-all outline-none min-h-[80px]"
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
