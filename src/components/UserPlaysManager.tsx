'use client';

import { useState } from "react";
import { updateUserPlays } from "@/app/actions";

interface Play {
  id: string;
  title: string;
}

export default function UserPlaysManager({ 
  userId, 
  allPlays, 
  initialAssigned 
}: { 
  userId: string; 
  allPlays: Play[]; 
  initialAssigned: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialAssigned || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    const res = await updateUserPlays(userId, selectedIds);
    if (res?.success) {
      setMessage('✅ Kadro başarıyla güncellendi!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Hata: ' + (res?.error || 'Bilinmeyen hata'));
    }
    setLoading(false);
  };

  const togglePlay = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-gold)]/10 text-[var(--primary-gold)] flex items-center justify-center text-xl">
          <ion-icon name="shirt-outline"></ion-icon>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-widest leading-none">Oyun / Kadro Ataması</h4>
          <p className="text-[10px] text-white/30 uppercase mt-1 tracking-tighter">Bu oyuncunun yer aldığı oyunları işaretleyin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {allPlays.map(play => (
          <div 
             key={play.id}
             onClick={() => togglePlay(play.id)}
             className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
               selectedIds.includes(play.id) 
                 ? 'bg-[var(--primary-gold)]/10 border-[var(--primary-gold)]/50 text-[var(--primary-gold)]' 
                 : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10'
             }`}
          >
             <span className="text-sm font-bold">{play.title}</span>
             <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
               selectedIds.includes(play.id) 
                 ? 'bg-[var(--primary-gold)] border-[var(--primary-gold)] text-black' 
                 : 'bg-transparent border-white/20'
             }`}>
               {selectedIds.includes(play.id) && <ion-icon name="checkmark-sharp" style={{ fontSize: '0.8rem' }}></ion-icon>}
             </div>
          </div>
        ))}
        {allPlays.length === 0 && <p className="text-xs text-white/20 italic">Sistemde henüz kayıtlı oyun bulunmuyor.</p>}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary py-3 px-8 text-xs font-bold tracking-widest uppercase shadow-glow disabled:opacity-30"
        >
          {loading ? 'Güncelleniyor...' : 'Kadroyu Güncelle'}
        </button>
        {message && <span className="text-xs font-bold animate-in fade-in duration-300">{message}</span>}
      </div>
    </div>
  );
}
