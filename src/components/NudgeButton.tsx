'use client';

import { nudgePlayers } from "@/app/actions";
import { useState } from "react";

export default function NudgeButton({ users }: { users: any[] }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [report, setReport] = useState<{ success: number; failure: number } | null>(null);

  const handleNudge = async () => {
    setLoading(true);
    setReport(null);
    const res = await nudgePlayers(selectedIds) as any;
    
    if (res.error) {
      alert("Hata: " + res.error);
    } else {
      setReport({ success: res.count, failure: res.failure });
    }
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
    }
  };

  const toggleUser = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <>
      <button 
        onClick={() => { setShowModal(true); setReport(null); }}
        className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] flex items-center gap-2 hover:bg-[var(--primary-gold)] hover:text-black py-2 px-6 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-[0_0_15px_rgba(212,175,55,0.1)]"
      >
        <ion-icon name="notifications-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
        Dürtme Paneli 🎭
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 border-[var(--primary-gold)]/30 border bg-[rgba(5,5,5,0.98)] shadow-[0_25px_50px_rgba(0,0,0,1)] rounded-3xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--primary-gold)]/5 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h3 className="serif-font text-2xl text-white tracking-tight">Oyuncuları <span className="text-[var(--primary-gold)]">Dürt</span></h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <ion-icon name="close-outline" style={{ fontSize: '1.8rem' }}></ion-icon>
                </button>
              </div>

              {report ? (
                <div className="space-y-8 text-center animate-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-gradient-to-br from-[var(--primary-gold)] to-[#b8860b] text-black rounded-[2rem] flex items-center justify-center mx-auto text-5xl shadow-2xl shadow-[var(--primary-gold)]/20 rotate-12">
                    <ion-icon name="paper-plane"></ion-icon>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-xl font-bold">Dürtme Tamamlandı!</h4>
                    <p className="text-white/50 text-sm">Anlık gönderim raporu aşağıdadır.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/20 group hover:bg-green-500/20 transition-all">
                      <span className="block text-3xl font-black text-green-500 mb-1">{report.success}</span>
                      <span className="text-[10px] uppercase text-green-500/60 font-black tracking-widest leading-none">ULAŞILDI</span>
                    </div>
                    <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 group hover:bg-red-500/20 transition-all">
                      <span className="block text-3xl font-black text-red-500 mb-1">{report.failure}</span>
                      <span className="text-[10px] uppercase text-red-500/60 font-black tracking-widest leading-none">KAPALI / HATA</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-white/90 transition-all uppercase tracking-tighter text-sm mt-4"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">Seçim Listesi</span>
                      <span className="text-[10px] text-white/40 uppercase mt-1">{selectedIds.length} Oyuncu Seçildi</span>
                    </div>
                    <button 
                      onClick={toggleSelectAll} 
                      className="text-[10px] text-[var(--primary-gold)] font-black uppercase tracking-widest bg-[var(--primary-gold)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--primary-gold)] hover:text-black transition-all"
                    >
                      {selectedIds.length === users.length ? 'BIRAK' : 'TÜMÜ'}
                    </button>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar">
                    {users.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all group ${
                          selectedIds.includes(u.id) 
                            ? 'bg-[var(--primary-gold)] border-[var(--primary-gold)]/50 text-black' 
                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-lg flex items-center justify-center border transition-all ${
                            selectedIds.includes(u.id) 
                              ? 'bg-black border-black text-[var(--primary-gold)]' 
                              : 'bg-transparent border-white/20 text-transparent'
                          }`}>
                            <ion-icon name="checkmark-bold" style={{ fontSize: '0.6rem' }}></ion-icon>
                          </div>
                          <div>
                            <span className={`text-[13px] font-bold block leading-none ${selectedIds.includes(u.id) ? 'text-black' : 'text-white'}`}>
                              {u.name} {u.surname}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded opacity-60 ${
                           selectedIds.includes(u.id) ? 'bg-black/10 border-black/20 text-black' : 'bg-white/10 border-white/20 text-white'
                        }`}>
                          {u.role === 'PLAYER' ? 'AKTOR' : u.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleNudge}
                    disabled={loading || (selectedIds.length === 0)}
                    className="w-full bg-[var(--primary-gold)] text-black font-black py-4 rounded-2xl hover:bg-[#b8860b] transition-all uppercase tracking-tighter text-sm disabled:opacity-20 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
                  >
                    <ion-icon name="paper-plane" className={loading ? 'animate-bounce' : ''}></ion-icon>
                    {loading ? 'Sinyal Gidiyor...' : 'Dürtmeyi Başlat 🎭'}
                  </button>
                  {selectedIds.length === 0 && (
                    <p className="text-[9px] text-white/30 text-center mt-3 uppercase tracking-widest font-bold">Lütfen dürtülecek kişileri seçin</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
