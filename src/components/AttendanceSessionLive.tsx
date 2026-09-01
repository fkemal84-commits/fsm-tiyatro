'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  closeAttendanceSession,
  nudgeUnansweredParticipants,
  recordManualAttendance,
  getLiveAttendanceQRToken
} from '@/app/actions';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Props {
  session: any;
  event: any;
  participants: any[];
  canManage: boolean;
}

export default function AttendanceSessionLive({ session, event, participants, canManage }: Props) {
  const [currentToken, setCurrentToken] = useState(session.token || '');
  const [records, setRecords] = useState<any[]>([]);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState('');
  const [nudgeErr, setNudgeErr] = useState('');
  const [manualUser, setManualUser] = useState('');
  const [manualStatus, setManualStatus] = useState('ATTENDED');
  const [manualNote, setManualNote] = useState('');

  // Canlı kayıtları dinle
  useEffect(() => {
    if (!session?.id) return;
    const q = query(
      collection(db, 'attendance_records'),
      where('sessionId', '==', session.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(recs);
    });

    return () => unsubscribe();
  }, [session?.id]);

  // QR Kodunu sunucudan her 40 saniyede bir imzalı olarak tazele (Server-Signed Rotating QR - Secret asla istemciye verilmez)
  useEffect(() => {
    if (!session?.id || !canManage) return;

    let isMounted = true;
    const refreshQR = async () => {
      try {
        const res = await getLiveAttendanceQRToken(session.id);
        if (res && res.success && res.token && isMounted) {
          setCurrentToken(res.token);
        }
      } catch (err) {
        console.error("Canlı QR alma hatası:", err);
      }
    };

    // İlk yüklemede mevcut token yoksa hemen çek
    if (!currentToken) {
      refreshQR();
    }

    const interval = setInterval(refreshQR, 40000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session?.id, canManage, currentToken]);

  const handleNudge = async () => {
    setNudgeLoading(true);
    setNudgeMsg('');
    setNudgeErr('');
    try {
      const res = await nudgeUnansweredParticipants(session.id);
      if (res && 'error' in res && res.error) {
        setNudgeErr(res.error);
      } else if (res && 'success' in res && res.success) {
        setNudgeMsg(res.message || 'Dürtme bildirimi gönderildi.');
      }
    } catch (e: any) {
      setNudgeErr('Dürtme sırasında hata oluştu.');
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser) return;
    await recordManualAttendance(session.id, manualUser, manualStatus as any, manualNote);
    setManualNote('');
    setManualUser('');
  };

  const attendedIds = new Set(records.filter(r => r.status === 'ATTENDED').map(r => r.userId));
  const excusedIds = new Set(records.filter(r => r.status === 'EXCUSED').map(r => r.userId));

  return (
    <div className="glass-card p-6 bg-zinc-950/90 border border-[var(--primary-gold)]/40 rounded-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Açık Yoklama Oturumu
          </span>
          <h3 className="serif-font text-xl text-white font-bold mt-1.5">{session.eventTitle}</h3>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={async () => {
              await closeAttendanceSession(session.id);
            }}
            className="py-1.5 px-4 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-500/30 font-bold text-xs transition-colors"
          >
            Oturumu Sonlandır ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Canlı QR Ekranı */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl text-center">
          <div className="p-3 bg-white rounded-xl">
            <QRCode value={currentToken || 'FSM-ATT:EMPTY'} size={220} />
          </div>
          <span className="text-[11px] font-bold text-zinc-600 mt-3 font-mono">
            🔄 Dinamik Güvenlikli QR (Otomatik Yenilenir)
          </span>
          <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px]">
            Katılımcılar telefon kameralarıyla bu QR kodu tarayarak varlıklarını doğrulayabilir.
          </p>
        </div>

        {/* Katılımcı Durum Listesi & Dürtme */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Katılım Durumu ({records.length} / {participants.length || '—'})
            </h4>
            {canManage && (
              <button
                onClick={handleNudge}
                disabled={nudgeLoading}
                className="py-1 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1"
              >
                <ion-icon name="notifications-outline"></ion-icon>
                {nudgeLoading ? 'Gönderiliyor...' : 'Cevaplamayanları Dürt 🔔'}
              </button>
            )}
          </div>

          {nudgeMsg && <div className="p-2 rounded bg-emerald-950/40 text-emerald-300 text-xs border border-emerald-500/30 font-medium">{nudgeMsg}</div>}
          {nudgeErr && <div className="p-2 rounded bg-red-900/40 text-red-300 text-xs border border-red-500/30 font-medium">{nudgeErr}</div>}

          {/* Liste */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {participants.map((p: any) => {
              const uid = p.id || p.actorId;
              const isAttended = attendedIds.has(uid);
              const isExcused = excusedIds.has(uid);

              return (
                <div key={uid} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                  <span className="font-medium text-zinc-200">{p.name || p.email}</span>
                  {isAttended ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Geldi</span>
                  ) : isExcused ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">⏱️ Mazeretli</span>
                  ) : (
                    <span className="text-zinc-500 italic">Cevap Yok</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Manuel Düzeltme Formu */}
          {canManage && (
            <form onSubmit={handleManualAdd} className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-zinc-400">Manuel Durum Güncelle</span>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={manualUser}
                  onChange={e => setManualUser(e.target.value)}
                  className="flex-1 p-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-white"
                  required
                >
                  <option value="">Katılımcı Seç...</option>
                  {participants.map((p: any) => (
                    <option key={p.id || p.actorId} value={p.id || p.actorId}>{p.name || p.email}</option>
                  ))}
                </select>
                <select
                  value={manualStatus}
                  onChange={e => setManualStatus(e.target.value)}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-white"
                >
                  <option value="ATTENDED">Geldi (Manuel)</option>
                  <option value="EXCUSED">Mazeretli</option>
                  <option value="NOT_ATTENDED">Gelmedi</option>
                </select>
                <button type="submit" className="py-1.5 px-3 rounded bg-[var(--primary-gold)] text-black font-bold text-xs">
                  Kaydet
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
