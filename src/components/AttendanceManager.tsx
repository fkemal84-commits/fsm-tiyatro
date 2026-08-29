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
    if ('success' in res && res.success) {
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
          className="flex items-center gap-2 text-xs font-bold text-[var(--primary-gold)] hover:underline transition-all bg-[var(--primary-gold-dim)] py-2.5 px-5 rounded-full border border-[var(--primary-gold-border)]"
        >
          <ion-icon name={open ? 'chevron-up-outline' : 'people-outline'}></ion-icon>
          {open ? 'Yoklama Panelini Kapat' : 'Yoklama ve Katılım Yönetimi'}
        </button>
        {open && (
           <button 
            onClick={exportCSV}
            className="flex items-center gap-2 text-xs font-bold text-[#10b981] hover:bg-[#10b981] hover:text-black transition-all bg-[#10b981]/10 py-2.5 px-5 rounded-full border border-[#10b981]/30"
          >
            <ion-icon name="download-outline"></ion-icon>
            Excel / CSV Olarak İndir
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 p-5 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-subtle)] space-y-6">
          
          {/* Nabız Yoklama Kontrolü */}
          <div className="p-4 bg-[var(--primary-gold-dim)] rounded-xl border border-[var(--primary-gold-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-[var(--primary-gold)] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                Canlı Yoklama
              </h3>
              <p className="text-[var(--text-dim)] text-xs mt-0.5">60 saniye içinde aktörlerden anlık onay toplar.</p>
            </div>
            
            {pulseActive ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-gold)] flex items-center justify-center text-sm font-bold text-[var(--primary-gold)] bg-[var(--bg-surface)]">
                  {pulseTimeLeft}
                </div>
                <span className="text-[var(--primary-gold)] font-bold text-xs animate-pulse">SİNYAL AÇIK</span>
              </div>
            ) : (
              <button 
                onClick={handleStartPulse}
                disabled={loading}
                className="btn btn-primary !py-2 !px-5 !rounded-lg !text-xs"
              >
                Yeni Yoklama Başlat
              </button>
            )}
          </div>

          {/* Mazeretli Ekleme Butonu ve Formu */}
          <div className="space-y-3">
            <button 
              onClick={() => setShowExcuseForm(!showExcuseForm)}
              className="w-full py-2.5 bg-[var(--bg-surface)] hover:border-[var(--primary-gold)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border-subtle)] transition-all flex items-center justify-center gap-2"
            >
              <ion-icon name={showExcuseForm ? 'close-outline' : 'add-outline'}></ion-icon>
              {showExcuseForm ? 'Vazgeç' : '+ Manuel Mazeretli Ekle'}
            </button>

            {showExcuseForm && (
              <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] space-y-3">
                <select 
                  value={selectedActorId}
                  onChange={(e) => setSelectedActorId(e.target.value)}
                  className="w-full p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-medium)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary-gold)]"
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
                  placeholder="Mazeret sebebi (Örn: Sınav, Hastalık)"
                  className="w-full p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-medium)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary-gold)]"
                />
                <button 
                  onClick={handleAddExcuse}
                  disabled={loading || !selectedActorId || !excuseNote}
                  className="w-full py-2.5 bg-[var(--primary-gold)] text-black font-bold text-xs uppercase rounded-lg hover:bg-[var(--primary-gold-light)] transition-all disabled:opacity-50"
                >
                  Mazereti Kaydet
                </button>
              </div>
            )}
          </div>

          {/* GRUPLANDIRILMIŞ LİSTE */}
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* 1. KATILANLAR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5 px-1">
                <ion-icon name="checkmark-circle"></ion-icon>
                Katılanlar ({groups.participants.length})
              </h4>
              {groups.participants.map(u => (
                <div key={u.id} className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[#10b981]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10b981] text-black flex items-center justify-center text-xs font-bold">
                      {u.name[0]}{u.surname[0]}
                    </div>
                    <div>
                      <p className="text-[var(--text-main)] text-xs font-bold">{u.name} {u.surname}</p>
                      <p className="text-[10px] text-[var(--text-dim)] uppercase">{u.role}</p>
                    </div>
                  </div>
                  {u.time && (
                    <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded border border-[#10b981]/20">
                      ONAY: {u.time}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 2. MAZERETLİLER */}
            {groups.excused.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <ion-icon name="information-circle"></ion-icon>
                  Mazeretliler ({groups.excused.length})
                </h4>
                {groups.excused.map(u => (
                  <div key={u.id} className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[#3b82f6]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-xs font-bold">
                        {u.name[0]}{u.surname[0]}
                      </div>
                      <p className="text-[var(--text-main)] text-xs font-bold">{u.name} {u.surname}</p>
                    </div>
                    <button onClick={() => setAttendance(prev => ({ ...prev, [u.id]: 'GELMEDİ' }))} className="text-[var(--text-dim)] hover:text-[#ef4444] transition-colors p-1">
                      <ion-icon name="trash-outline"></ion-icon>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 3. KATILMAYANLAR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider flex items-center gap-1.5 px-1">
                <ion-icon name="close-circle"></ion-icon>
                Gelmeyenler / Henüz Yanıt Yok ({groups.missing.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groups.missing.map(u => (
                  <div key={u.id} className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-dim)] flex items-center justify-center text-xs font-bold">
                        {u.name[0]}{u.surname[0]}
                      </div>
                      <p className="text-[var(--text-muted)] text-xs font-medium">{u.name} {u.surname}</p>
                    </div>
                    <button 
                      onClick={() => setAttendance(prev => ({ ...prev, [u.id]: 'GELDİ' }))}
                      className="opacity-0 group-hover:opacity-100 bg-[#10b981] text-black px-2 py-1 rounded text-[10px] font-bold transition-all"
                      title="Manuel Geldi İşaretle"
                    >
                      Geldi ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Yönetmen Notu */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider px-1 flex items-center gap-1.5">
              <ion-icon name="create-outline"></ion-icon>
              Yönetmen Prova Notu
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prova disiplini veya sahneleme hakkında notunuz..."
              className="w-full p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--border-medium)] text-[var(--text-main)] text-xs focus:border-[var(--primary-gold)] transition-all outline-none min-h-[70px]"
            />
          </div>

          <button 
            onClick={save}
            disabled={loading}
            className="w-full btn btn-primary py-3 rounded-xl font-bold tracking-wider text-xs"
          >
            {loading ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
}
