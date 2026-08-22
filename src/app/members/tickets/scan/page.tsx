'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { verifyTicket } from '@/app/actions';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default function TicketScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          false
        );
        scannerRef.current = scanner;

        scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (loading) return;
    
    if (scannerRef.current) {
        scannerRef.current.pause(true);
    }

    setScanResult(decodedText);
    setLoading(true);
    setVerification(null);

    try {
      const res = await verifyTicket(decodedText);
      if (res.error) {
        setVerification({ type: 'error', text: res.error });
      } else if (res.success) {
        setVerification({ type: 'success', text: res.message || 'Giriş Onaylandı!' });
      }
    } catch (err) {
      setVerification({ type: 'error', text: 'Bağlantı hatası nedeniyle doğrulama yapılamadı.' });
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = () => {
    // Silent
  };

  const resumeScanning = () => {
    setScanResult(null);
    setVerification(null);
    if (scannerRef.current) {
        scannerRef.current.resume();
    }
  };

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div className="space-y-6 flex flex-col items-center max-w-4xl mx-auto">
        <div className="w-full max-w-lg mb-4 text-center">
            <h1 className="serif-font text-3xl font-bold text-[var(--text-main)] mb-2">QR Bilet Kontrolü</h1>
            <p className="text-[var(--text-muted)] text-sm">Seyircinin bilet QR kodunu kameraya okutun.</p>
        </div>

        <div className="glass-card w-full max-w-lg p-4 relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-subtle)]">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:w-full [&_button]:bg-[var(--primary-gold)] [&_button]:text-black [&_button]:font-bold [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:mt-4 [&_select]:bg-[var(--input-bg)] [&_select]:text-[var(--text-main)] [&_select]:border-[var(--border-medium)] [&_select]:rounded-lg [&_select]:p-2 [&_a]:hidden bg-transparent border-none!"></div>

            {loading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="text-[var(--primary-gold)] text-lg font-bold animate-pulse">Doğrulanıyor...</div>
                </div>
            )}
        </div>

        {verification && (
            <div className={`w-full max-w-lg p-6 rounded-2xl text-center shadow-xl ${
                verification.type === 'success' 
                    ? 'bg-green-500/15 border-2 border-green-500' 
                    : 'bg-red-500/15 border-2 border-red-500'
            }`}>
               <ion-icon 
                   name={verification.type === 'success' ? 'checkmark-circle' : 'close-circle'} 
                   style={{ fontSize: '4rem', color: verification.type === 'success' ? '#22c55e' : '#ef4444' }}
               ></ion-icon>
               
               <h3 className={`text-xl font-bold mt-3 uppercase ${verification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                   {verification.type === 'success' ? 'Giriş Başarılı' : 'Bilet Geçersiz / Kullanılmış'}
               </h3>
               
               <p className="text-[var(--text-main)] font-medium text-base mt-2 mb-6">{verification.text}</p>
               
               <button 
                  onClick={resumeScanning}
                  className="btn btn-primary py-2.5 px-6 font-bold text-xs"
               >
                   Sıradaki Bileti Okut
               </button>
            </div>
        )}

        <div className="mt-6">
          <Link href="/members/tickets" className="text-xs text-[var(--text-dim)] hover:text-[var(--primary-gold)] uppercase font-bold tracking-wider">
            ← Bilet Yönetim Paneline Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
