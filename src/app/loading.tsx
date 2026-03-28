export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full bg-[var(--bg-dark)]">
      <div className="relative w-20 h-20 mb-6">
        {/* Kültür/Sanat Temalı Yükleme İkonu */}
        <div className="absolute inset-0 border-4 border-[var(--primary-gold-dim)] rounded-full animate-ping"></div>
        <div className="absolute inset-2 border-4 border-t-[var(--primary-gold)] border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50">
           🎭
        </div>
      </div>
      <h2 className="serif-font text-2xl text-[var(--primary-gold)] animate-pulse">Sahne Hazırlanıyor...</h2>
      <p className="text-[var(--text-muted)] text-sm mt-2 tracking-widest uppercase">FSM Tiyatro Portal</p>
    </div>
  );
}
