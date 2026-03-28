'use client';

import { useState } from 'react';
import { markAttendance } from '@/app/actions';

interface User {
  id: string;
  name: string;
  surname: string;
  role: string;
}

export default function AttendanceManager({ 
  rehearsalId, 
  allUsers, 
  initialAttendance 
}: { 
  rehearsalId: string, 
  allUsers: User[], 
  initialAttendance: string[] 
}) {
  const [attendance, setAttendance] = useState<string[]>(initialAttendance || []);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleToggle(userId: string) {
    const newAttendance = attendance.includes(userId) 
      ? attendance.filter(id => id !== userId)
      : [...attendance, userId];
    
    setAttendance(newAttendance);
  }

  async function save() {
    setLoading(true);
    await markAttendance(rehearsalId, attendance);
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="mt-4">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold text-[var(--primary-gold)] hover:text-white transition-all bg-white/5 py-2 px-4 rounded-full"
      >
        <ion-icon name="people-outline"></ion-icon>
        {open ? 'LİSTEYİ KAPAT' : `YOKLAMA AL (${attendance.length}/${allUsers.length})`}
      </button>

      {open && (
        <div className="mt-4 p-5 bg-black/60 rounded-2xl border border-[var(--primary-gold)]/20 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {allUsers.map((u) => (
              <div 
                key={u.id} 
                onClick={() => handleToggle(u.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  attendance.includes(u.id) 
                  ? 'bg-[var(--primary-gold)]/20 border-[var(--primary-gold)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${attendance.includes(u.id) ? 'bg-[var(--primary-gold)] text-black' : 'bg-white/10 text-white'}`}>
                    {u.name[0]}{u.surname[0]}
                  </div>
                  <span className="text-xs text-white font-medium">{u.name} {u.surname}</span>
                </div>
                {attendance.includes(u.id) && (
                  <ion-icon name="checkmark-circle" style={{ color: 'var(--primary-gold)' }}></ion-icon>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={save}
            disabled={loading}
            className="w-full mt-6 btn btn-primary text-xs font-bold tracking-widest"
          >
            {loading ? 'KAYDEDİLİYOR...' : 'YOKLAMAYI MÜHÜRLE'}
          </button>
        </div>
      )}
    </div>
  );
}
