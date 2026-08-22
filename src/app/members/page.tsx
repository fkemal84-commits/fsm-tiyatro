import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addTeamNeed, addEvent } from "@/app/actions";
import { getWhatsAppEventLink } from "@/lib/utils";
import { Metadata } from "next";
import JoinEventButton from "../../components/JoinEventButton";
import ScriptVault from "@/components/ScriptVault";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Üye Panosu",
  description: "FSM Tiyatro üyelerine özel prova takvimi ve ekip duyuruları.",
};

export default async function MembersDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const canAdd = role === 'ADMIN' || role === 'SUPERADMIN';

  const rawName = session?.user?.name || '';
  const cleanName = rawName.replace(/undefined/gi, '').trim() || session?.user?.email?.split('@')[0] || 'Üye';

  const rehearsalsSnapshot = await adminDb.collection('events').get();
  const events = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const scriptsSnapshot = await adminDb.collection('scripts').get();
  const scripts = scriptsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const canManageScripts = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role);

  const teamNeedsSnapshot = await adminDb.collection('teamNeeds').where('isActive', '==', true).get();
  const teamNeeds = teamNeedsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const inputStyle = {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <h1 className="serif-font text-5xl text-[var(--primary-gold)] mb-3">Üye Panosu</h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-sm">
          {session ? (
            <>Hoş geldin, <span className="text-[var(--text-main)] font-bold">{cleanName}</span>!</>
          ) : (
            <>FSM Vakıf Üniversitesi Sinema ve Tiyatro Kulübü <span className="text-[var(--text-main)] font-bold">Dijital Panosu</span></>
          )}
        </p>
      </header>

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* ETKİNLİKLER KARTI */}
        <div className="glass-card">
          <h2 className="text-[var(--text-main)] text-2xl mb-6 border-b border-[var(--border-subtle)] pb-4 flex items-center gap-2 font-bold">
            Yaklaşan Etkinlikler
          </h2>
          
          {canAdd && (
            <form action={addEvent as any} className="mb-6 bg-[var(--primary-gold-dim)] p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold-border)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-bold">+ Yeni Etkinlik Ekle (Yönetici)</h4>
              <input type="text" name="title" placeholder="Etkinlik Adı" style={inputStyle} required />
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] pointer-events-none text-sm">
                    <ion-icon name="calendar-outline"></ion-icon>
                  </span>
                  <input 
                    type="date" 
                    name="eventDate" 
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                    required 
                  />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] pointer-events-none text-sm">
                    <ion-icon name="time-outline"></ion-icon>
                  </span>
                  <input 
                    type="time" 
                    name="eventTime" 
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                    required 
                  />
                </div>
              </div>
              <input type="text" name="location" placeholder="Konum" style={inputStyle} required />
              <textarea name="description" placeholder="Etkinlik Detayları..." style={inputStyle} rows={2}></textarea>
              <button type="submit" className="btn btn-primary mt-2">
                Etkinliği Yayınla
              </button>
            </form>
          )}

          {events.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Şu an için planlanmış bir etkinlik bulunmuyor.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((e: any) => (
                <li key={e.id} className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[var(--primary-gold)] font-bold text-lg">📢 {e.title}</h4>
                    {canAdd && (
                      <a 
                        href={getWhatsAppEventLink(e)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white p-2 rounded-lg flex items-center justify-center hover:scale-105 transition-all text-xs gap-1 font-bold"
                        title="WhatsApp grubunda duyur"
                      >
                        <ion-icon name="logo-whatsapp"></ion-icon> Duyur
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-main)]">⏰ {e.date}</div>
                  <div className="text-sm text-[var(--text-muted)] mb-3">📍 {e.location}</div>
                  {e.description && <p className="text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-subtle)]">{e.description}</p>}
                  
                  <JoinEventButton eventId={e.id} eventTitle={e.title} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* EKİP İHTİYAÇLARI */}
        <div className="glass-card">
          <h2 className="text-[var(--text-main)] text-2xl mb-6 border-b border-[var(--border-subtle)] pb-4 flex items-center gap-2 font-bold">
            Ekip İhtiyaç İlanları
          </h2>

          {canAdd && (
             <form action={addTeamNeed as any} className="mb-6 bg-[var(--primary-gold-dim)] p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold-border)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-bold">+ Yeni Personel Açığı Ekle (Yönetici)</h4>
              <input type="text" name="roleName" placeholder="Aranan Yetenek" style={inputStyle} required />
              <textarea name="description" placeholder="Beklentilerimiz..." rows={3} style={inputStyle} required></textarea>
              <button type="submit" className="btn btn-primary mt-2">
                İlanı Yayınla
              </button>
            </form>
          )}

          {teamNeeds.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Şu an için açık bir ekip personel ilanı yok.</p>
          ) : (
            <ul className="space-y-4">
              {teamNeeds.map((t: any) => (
                <li key={t.id} className="p-5 bg-[var(--bg-surface-elevated)] border border-[var(--primary-gold-border)] rounded-xl transition-all">
                  <h4 className="text-[var(--text-main)] font-bold text-xl mb-2">🎯 {t.roleName} Aranıyor!</h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{t.description}</p>
                  <button className="btn btn-outline w-full text-xs py-2">Ekibe Katılmak İçin Başvur</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SENARYO KÜTÜPHANESİ - SADECE YETKİLİLER VE AKTÖRLERE ÖZEL */}
        <div className="md:col-span-2">
          {['AKTOR', 'PLAYER', 'DIRECTOR', 'ASST_DIRECTOR', 'SUPERADMIN', 'ADMIN'].includes(role) && (
            <ScriptVault initialScripts={scripts} canManage={canManageScripts} />
          )}
        </div>

      </div>
      </ScrollReveal>
    </div>
  );
}
