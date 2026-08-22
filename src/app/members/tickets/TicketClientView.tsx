'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTicket, deleteTicket, updateTicketReference } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';
import SeatMap, { OccupiedSeat } from '@/components/SeatMap';
import Link from 'next/link';

interface Ticket {
  id: string;
  name: string;
  surname: string;
  identifier: string;
  row?: string | null;
  seatNumber?: string | null;
  reference?: string | null;
  status: 'VALID' | 'USED';
  createdAt: string;
}

export default function TicketClientView({ initialTickets }: { initialTickets: Ticket[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<{ row: string; seatNumber: string } | null>(null);
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [refInput, setRefInput] = useState('');
  const router = useRouter();

  const filteredTickets = initialTickets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const occupiedSeats: OccupiedSeat[] = initialTickets
    .filter(t => t.row && t.seatNumber)
    .map(t => ({
      row: t.row!,
      seatNumber: t.seatNumber!,
      ticketHolder: `${t.name} ${t.surname}`
    }));

  const referenceStats = initialTickets.reduce((acc, t) => {
    const ref = t.reference?.trim() || 'Referanssız (Gişe/Diğer)';
    acc[ref] = (acc[ref] || 0) + 1;
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

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '0.875rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'var(--text-dim)',
    textTransform: 'uppercase' as const,
    marginBottom: '0.35rem',
  };

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border-subtle)] pb-6 gap-6">
          <div>
            <h1 className="serif-font text-3xl sm:text-4xl font-bold text-[var(--text-main)]">Gişe & Bilet Yönetimi</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Elden satılan biletleri isimlere tanımlayın, koltuk atayın ve takip edin.</p>
          </div>
          <Link href="/members/tickets/scan" className="btn btn-primary flex gap-2 w-full md:w-auto justify-center">
            <ion-icon name="scan-outline" style={{ fontSize: '1.2rem' }}></ion-icon> Kapı Kontrol Modu
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Sütun: Bilet Ekleme Formu */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 md:p-8 bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-xl">
              <h2 className="text-xl font-bold text-[var(--primary-gold)] mb-6 flex gap-2 items-center">
                <ion-icon name="ticket-outline"></ion-icon> Yeni Bilet Tanımla
              </h2>

              {message.text && (
                <div className={`p-3.5 rounded-xl text-xs font-bold mb-6 ${
                  message.type === 'error' 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>İsim (Seyirci)</label>
                    <input 
                      name="name" 
                      type="text" 
                      required
                      style={inputStyle}
                      placeholder="Örn: Ahmet"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Soyisim</label>
                    <input 
                      name="surname" 
                      type="text" 
                      required
                      style={inputStyle}
                      placeholder="Örn: Yılmaz"
                    />
                  </div>
                </div>

                <div>
                   <label style={labelStyle}>Telefon / Öğrenci No</label>
                   <input 
                      name="identifier" 
                      type="text" 
                      required
                      style={inputStyle}
                      placeholder="Örn: 05XX XXX XX XX"
                   />
                </div>

                <div>
                   <label style={labelStyle}>Referans (Kim Sattı?)</label>
                   <input 
                      name="reference" 
                      type="text" 
                      style={inputStyle}
                      placeholder="Örn: Ayşe veya X Gişesi"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Sıra</label>
                    <input 
                      name="row" 
                      type="text" 
                      readOnly
                      value={selectedSeat?.row || ''}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      placeholder="Haritadan seçin"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Koltuk No</label>
                    <input 
                      name="seatNumber" 
                      type="text" 
                      readOnly
                      value={selectedSeat?.seatNumber || ''}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      placeholder="Haritadan seçin"
                    />
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <label style={labelStyle}>Koltuk Haritası</label>
                  <SeatMap 
                    occupiedSeats={occupiedSeats} 
                    selectedSeat={selectedSeat} 
                    onSeatSelect={(row, seatNumber) => setSelectedSeat({ row, seatNumber })} 
                  />
                </div>

                <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full btn btn-primary py-3.5 font-bold text-xs uppercase"
                >
                  {loading ? 'Oluşturuluyor...' : 'Bileti Sisteme Kaydet'}
                </button>
              </form>
            </div>
          </div>

          {/* Sağ Sütun: Bilet Listesi */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 md:p-8 bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-xl h-full flex flex-col">
              
              {/* Referans Özeti */}
              {sortedReferences.length > 0 && (
                <div className="mb-8 p-5 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl">
                  <h3 className="text-xs font-bold text-[var(--text-dim)] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <ion-icon name="people-outline"></ion-icon> Satış Liderlik Tablosu
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {sortedReferences.map(([refName, count]) => (
                      <div key={refName} className="flex items-center gap-3 bg-[var(--primary-gold-dim)] border border-[var(--primary-gold-border)] px-4 py-2 rounded-lg">
                        <span className="text-xs font-bold text-[var(--text-main)]">{refName}</span>
                        <span className="text-xs bg-[var(--primary-gold)] text-black font-black px-2 py-0.5 rounded-full">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-[var(--primary-gold)] flex gap-2 items-center">
                  <ion-icon name="list-outline"></ion-icon> Satılan Biletler ({initialTickets.length})
                </h2>
                
                <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="İsim veya telefon ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-dim)] text-sm">
                  {searchTerm ? 'Aramaya uygun bilet bulunamadı.' : 'Henüz tanımlanmış bir bilet yok.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[var(--text-main)]">
                    <thead className="border-b border-[var(--border-medium)] text-[10px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
                      <tr>
                        <th className="py-3 px-2">Seyirci</th>
                        <th className="py-3 px-2">Telefon/No</th>
                        <th className="py-3 px-2">Koltuk</th>
                        <th className="py-3 px-2">Referans</th>
                        <th className="py-3 px-2">Durum</th>
                        <th className="py-3 px-2 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
                          <td className="py-3 px-2 font-bold text-[var(--text-main)]">
                            {ticket.name} {ticket.surname}
                          </td>
                          <td className="py-3 px-2 text-[var(--text-muted)]">{ticket.identifier}</td>
                          <td className="py-3 px-2">
                            {ticket.row && ticket.seatNumber ? (
                              <span className="font-mono bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                                {ticket.row}-{ticket.seatNumber}
                              </span>
                            ) : (
                              <span className="text-[var(--text-dim)]">Genel</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {editingRefId === ticket.id ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text" 
                                  value={refInput}
                                  onChange={(e) => setRefInput(e.target.value)}
                                  className="p-1 text-xs bg-[var(--input-bg)] border border-[var(--primary-gold)] rounded text-[var(--text-main)] w-24 outline-none"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleUpdateReference(ticket.id, refInput)}
                                  className="text-green-500 font-bold p-1"
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => setEditingRefId(null)}
                                  className="text-red-500 font-bold p-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  setEditingRefId(ticket.id);
                                  setRefInput(ticket.reference || '');
                                }}
                                className="cursor-pointer group/ref flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--primary-gold)]"
                                title="Referansı düzenlemek için tıklayın"
                              >
                                <span>{ticket.reference || '—'}</span>
                                <span className="opacity-0 group-hover/ref:opacity-100 text-[10px]">✏️</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {ticket.status === 'VALID' ? (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                                GEÇERLİ
                              </span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded text-[10px] border border-rose-500/20">
                                KULLANILDI
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <DeleteButton 
                              action={deleteTicket as any}
                              id={ticket.id}
                              name={`${ticket.name} ${ticket.surname} biletini`}
                              confirmMessage="Bu bileti kalıcı olarak silmek istediğinize emin misiniz?"
                              idFieldName="ticketId"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
