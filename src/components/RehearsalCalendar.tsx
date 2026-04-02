'use client';

import { useState, useEffect } from 'react';

export default function RehearsalCalendar({ rehearsals }: { rehearsals: any[] }) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (!currentDate) {
    return <div className="p-20 text-center text-white/20 animate-pulse">Takvim Yükleniyor...</div>;
  }

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
    setSelectedDay(null);
  };

  const getRehearsalsForDay = (day: number) => {
    return rehearsals.filter(r => {
      if (!r.date || r.date.includes('(Anlık)')) return false;
      
      const datePart = r.date.split(' - ')[0];
      const numbers = datePart.split(/[-/]/).map(Number);
      
      if (numbers.length < 3) return false;
      
      const [ry, rm, rd] = numbers;
      return ry === year && (rm - 1) === month && rd === day;
    });
  };

  const daysArr = [];
  for (let i = 0; i < firstDayIndex; i++) daysArr.push(null);
  for (let i = 1; i <= daysInMonth(month, year); i++) daysArr.push(i);

  const dayRehearsals = selectedDay ? getRehearsalsForDay(selectedDay) : [];

  return (
    <div className="glass-card md:p-10 border-[var(--primary-gold)]/20 animate-in fade-in zoom-in duration-500 bg-white/[0.01] overflow-hidden relative">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--primary-gold)]/5 rounded-full blur-[100px]"></div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 relative z-10">
        <h2 className="serif-font text-3xl md:text-4xl text-white">
          {monthNames[month]} <span className="text-[var(--primary-gold)]">{year}</span>
          <span className="text-[10px] ml-3 opacity-30 font-mono tracking-widest">({rehearsals.length} Kayıt)</span>
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={() => changeMonth(-1)} 
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-[var(--primary-gold)] hover:text-black hover:scale-105 transition-all border border-white/5"
          >
            <ion-icon name="chevron-back-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
          </button>
          <button 
            onClick={() => { setSelectedDay(null); setCurrentDate(new Date()); }}
            className="px-6 rounded-2xl bg-white/5 text-white/50 hover:text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
          >
            Bugün
          </button>
          <button 
            onClick={() => changeMonth(1)} 
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-[var(--primary-gold)] hover:text-black hover:scale-105 transition-all border border-white/5"
          >
            <ion-icon name="chevron-forward-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4 mb-10 relative z-10">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-white/20 uppercase tracking-[2px] mb-4">{d}</div>
        ))}
        
        {daysArr.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
          
          const todaysRehearsals = getRehearsalsForDay(day);
          const hasRehearsals = todaysRehearsals.length > 0;
          const isSelected = selectedDay === day;
          const isRealToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative border group ${
                isSelected 
                  ? 'bg-[var(--primary-gold)] border-[var(--primary-gold)] text-black shadow-2xl shadow-[var(--primary-gold)]/20 scale-[1.08] z-20' 
                  : isRealToday
                  ? 'bg-white/10 border-[var(--primary-gold)]/50 text-white z-10'
                  : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span className={`text-sm md:text-base font-black ${isSelected ? 'text-black' : 'text-white'}`}>{day}</span>
              {hasRehearsals && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all ${
                  isSelected ? 'bg-black' : 'bg-[var(--primary-gold)] shadow-[0_0_8px_var(--primary-gold)] group-hover:scale-125'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-10 pt-10 border-t border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 rounded-2xl bg-[var(--primary-gold)]/10 text-[var(--primary-gold)] flex items-center justify-center text-2xl font-black border border-[var(--primary-gold)]/20">
               {selectedDay}
             </div>
             <div>
               <h3 className="text-white text-xl font-black uppercase tracking-tighter">{monthNames[month]} {year}</h3>
               <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Bu tarihteki planlanan çalışmalar</p>
             </div>
           </div>

           {dayRehearsals.length === 0 ? (
             <div className="p-10 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
               <p className="text-white/20 italic text-sm font-medium">Bu tarihte henüz bir prova planlanmadı.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayRehearsals.map(r => (
                  <div key={r.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-[var(--primary-gold)]/40 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[var(--primary-gold)]/20"></div>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-[var(--primary-gold)] font-black text-lg tracking-tight group-hover:translate-x-1 transition-transform">{r.title}</h4>
                      <span className="text-[9px] font-black text-black bg-[var(--primary-gold)] px-2 py-0.5 rounded-lg uppercase tracking-tighter shadow-glow-sm">PROVA</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 text-white/70 text-xs font-semibold">
                         <ion-icon name="time-outline" style={{ color: 'var(--primary-gold)', fontSize: '1rem' }}></ion-icon>
                         {r.date?.split(' - Saat: ')[1] || 'Henüz Belirtilmedi'}
                       </div>
                       <div className="flex items-center gap-3 text-white/70 text-xs font-semibold">
                         <ion-icon name="location-outline" style={{ color: 'var(--primary-gold)', fontSize: '1rem' }}></ion-icon>
                         {r.location || 'Haliç Yerleşkesi'}
                       </div>
                    </div>
                    {r.notes && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-white/40 leading-relaxed font-medium italic">"{r.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      <div className="mt-20 p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-[10px] font-mono text-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary-gold)]/20"></div>
        <div className="flex items-center gap-2 mb-2 text-[var(--primary-gold)]/40 font-black tracking-widest uppercase">
          <ion-icon name="bug-outline"></ion-icon>
          Sistem Denetimi (Veri Akışı)
        </div>
        <div className="flex flex-col gap-1">
          <span>Toplam Kayıt Sayısı: <span className="text-white/40">{rehearsals.length}</span></span>
          <span className="truncate">Veritabanı Tarihleri: <span className="text-white/40">{rehearsals.map(r => r.date).join(' | ') || 'Yok'}</span></span>
        </div>
      </div>
    </div>
  );
}
