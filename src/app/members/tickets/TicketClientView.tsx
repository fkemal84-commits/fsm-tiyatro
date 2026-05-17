'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addTicket, deleteTicket, updateTicketReference } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';
import SeatMap, { OccupiedSeat } from '@/components/SeatMap';

interface Ticket {
  id: string;
  name: string;
  surname: string;
  identifier: string;
  row: string | null;
  seatNumber: string | null;
  reference?: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  initialTickets: Ticket[];
}

export default function TicketClientView({ initialTickets }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<{ row: string; seatNumber: string } | null>(null);
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [editingRefValue, setEditingRefValue] = useState<string>('');
  const router = useRouter();

  const occupiedSeats: OccupiedSeat[] = initialTickets
    .filter(t => t.row && t.seatNumber)
    .map(t => ({
      row: t.row!,
      seatNumber: t.seatNumber!,
      name: t.name,
      surname: t.surname,
      reference: t.reference
    }));

  const filteredTickets = initialTickets.filter(ticket => {
    const term = searchTerm.toLowerCase();
    return (
      ticket.name?.toLowerCase().includes(term) ||
      ticket.surname?.toLowerCase().includes(term) ||
      ticket.identifier?.toLowerCase().includes(term) ||
      ticket.reference?.toLowerCase().includes(term)
    );
  });

  const referenceStats = initialTickets.reduce((acc, ticket) => {
    if (ticket.reference) {
      const ref = ticket.reference.trim().toUpperCase();
      acc[ref] = (acc[ref] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedReferences = Object.entries(referenceStats).sort((a, b) => b[1] - a[1]);

  const handleUpdateReference = async (ticketId: string, newReference: string) => {
    const formData = new FormData();
    formData.set('ticketId', ticketId);
    formData.set('reference', newReference);
    
    const res = await updateTicketReference(formData);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else if (res.success) {
      setEditingRefId(null);
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(e.currentTarget);
    if (selectedSeat) {
      formData.set('row', selectedSeat.row);
      formData.set('seatNumber', selectedSeat.seatNumber);
    }
    
    try {
      const res = await addTicket(formData);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else if (res.success) {
        setMessage({ type: 'success', text: 'Bilet başarıyla oluşturuldu ve sisteme eklendi!' });
        (e.target as HTMLFormElement).reset();
        setSelectedSeat(null);
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Beklenmeyen bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-6">
          <div>
            <h1 className="text-3xl font-black text-[var(--primary-gold)] tracking-tight">Gişe & Bilet Yönetimi</h1>
            <p className="text-white/60 mt-1">Sistemden elden sattığınız biletleri isimlere tanımlayın ve takip edin.</p>
          </div>
          <a href="/members/tickets/scan" className="btn btn-primary bg-green-500 hover:bg-green-600 border-none flex gap-2 text-white w-full md:w-auto justify-center">
            <ion-icon name="scan-outline" style={{ fontSize: '1.2rem' }}></ion-icon> Kapı Kontrol
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Sütun: Bilet Ekleme Formu */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 md:p-8 border-white/10 bg-white/[0.02] shadow-2xl">
              <h2 className="text-xl font-bold text-[var(--primary-gold)] mb-6 flex gap-2 items-center">
                <ion-icon name="ticket-outline"></ion-icon> Yeni Bilet Tanımla
              </h2>

              {message.text && (
                <div className={`p-4 rounded-xl text-sm font-bold mb-6 ${
                  message.type === 'error' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">İSİM (Seyirci)</label>
                    <input 
                      name="name" 
                      type="text" 
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="Örn: Ahmet"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">SOYİSİM</label>
                    <input 
                      name="surname" 
                      type="text" 
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="Örn: Yılmaz"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-white/50 uppercase mb-2">TELEFON / ÖĞRENCİ NO</label>
                   <input 
                      name="identifier" 
                      type="text" 
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="İleride doğrulama ihtimaline karşı"
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold text-white/50 uppercase mb-2">REFERANS (KİM SATTI?)</label>
                   <input 
                      name="reference" 
                      type="text" 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="Örn: Ayşe veya X Gişesi"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">SIRA (OPSİYONEL)</label>
                    <input 
                      name="row" 
                      type="text" 
                      readOnly
                      value={selectedSeat?.row || ''}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="Haritadan seçin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">KOLTUK NO (OPSİYONEL)</label>
                    <input 
                      name="seatNumber" 
                      type="text" 
                      readOnly
                      value={selectedSeat?.seatNumber || ''}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary-gold)] placeholder:text-white/20"
                      placeholder="Haritadan seçin"
                    />
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">KOLTUK SEÇİMİ</label>
                  <SeatMap 
                    occupiedSeats={occupiedSeats} 
                    selectedSeat={selectedSeat} 
                    onSeatSelect={(row, seatNumber) => setSelectedSeat({ row, seatNumber })} 
                  />
                </div>

                <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full bg-[var(--primary-gold)] text-black font-black py-4 rounded-xl transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : 'SİSTEME KAYDET VE BİLET OLUŞTUR'}
                </button>
              </form>
            </div>
          </div>

          {/* Sağ Sütun: Bilet Listesi */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 md:p-8 border-white/10 bg-white/[0.02] shadow-2xl h-full flex flex-col">
              
              {/* Referans Özeti */}
              {sortedReferences.length > 0 && (
                <div className="mb-8 p-5 bg-black/40 border border-white/10 rounded-xl">
                  <h3 className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <ion-icon name="people-outline"></ion-icon> SATIŞ LİDERLİK TABLOSU (KİM KAÇ BİLET SATTI?)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {sortedReferences.map(([refName, count]) => (
                      <div key={refName} className="flex items-center gap-3 bg-[var(--primary-gold)]/10 border border-[var(--primary-gold)]/30 px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                        <span className="text-sm font-bold text-white">{refName}</span>
                        <span className="text-xs bg-[var(--primary-gold)] text-black font-black px-2 py-0.5 rounded-full">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-[var(--primary-gold)] flex gap-2 items-center">
                  <ion-icon name="list-outline"></ion-icon> Satılan Biletler
                </h2>
                
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="İsim veya telefon ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 pl-10 text-white focus:outline-none focus:border-[var(--primary-gold)] text-sm"
                  />
                  <ion-icon name="search-outline" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></ion-icon>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar flex-1 w-full">
                <table className="w-full min-w-[600px] text-left text-white border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/20 text-white/60">
                      <th className="p-3">Ad Soyad</th>
                      <th className="p-3">İletişim / No</th>
                      <th className="p-3 text-center">Koltuk</th>
                      <th className="p-3 text-center">Referans</th>
                      <th className="p-3 text-center">Durum</th>
                      <th className="p-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-medium capitalize">{ticket.name} {ticket.surname}</td>
                        <td className="p-3 text-white/80">{ticket.identifier}</td>
                        <td className="p-3 text-center text-[var(--primary-gold)]">
                          {(ticket.row || ticket.seatNumber) ? `${ticket.row || '-'} / ${ticket.seatNumber || '-'}` : '-'}
                        </td>
                        <td className="p-3 text-center text-white/60 text-xs cursor-pointer group" onClick={() => {
                          if (editingRefId !== ticket.id) {
                              setEditingRefId(ticket.id);
                              setEditingRefValue(ticket.reference || '');
                          }
                        }}>
                          {editingRefId === ticket.id ? (
                            <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                              <input 
                                type="text" 
                                value={editingRefValue} 
                                onChange={e => setEditingRefValue(e.target.value)}
                                className="w-20 bg-black/50 border border-white/20 rounded px-2 py-1 text-white focus:border-[var(--primary-gold)] outline-none text-xs"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateReference(ticket.id, editingRefValue);
                                  if (e.key === 'Escape') setEditingRefId(null);
                                }}
                              />
                              <button 
                                className="text-green-400 hover:text-green-300 transition-colors p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateReference(ticket.id, editingRefValue);
                                }}
                              >
                                <ion-icon name="checkmark-outline"></ion-icon>
                              </button>
                              <button 
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRefId(null);
                                }}
                              >
                                <ion-icon name="close-outline"></ion-icon>
                              </button>
                            </div>
                          ) : (
                            <span className="group-hover:text-white transition-colors flex items-center justify-center gap-1">
                              {ticket.reference || '-'}
                              <ion-icon name="pencil-outline" className="opacity-0 group-hover:opacity-100 transition-opacity"></ion-icon>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            ticket.status === 'USED' 
                              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' 
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {ticket.status === 'USED' ? 'KULLANILDI' : 'GEÇERLİ'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <DeleteButton 
                            action={deleteTicket as any} 
                            id={ticket.id} 
                            name={`${ticket.name} ${ticket.surname} bileti`} 
                            confirmMessage="Bu bileti tamamen silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)" 
                            idFieldName="ticketId"
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-white/40">
                          {searchTerm ? 'Aranan kriterlere uygun bilet bulunamadı.' : 'Henüz bilet satışı yapılmamış.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-white/40 text-right">
                Toplam bilet sayısı: {filteredTickets.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
