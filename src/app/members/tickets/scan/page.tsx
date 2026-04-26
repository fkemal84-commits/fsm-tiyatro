'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { verifyTicket } from '@/app/actions';

export default function TicketScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Only init if we haven't already
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
      // Cleanup
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple scans while processing
    if (loading) return;
    
    // Pause scanner visual
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
      setVerification({ type: 'error', text: 'Bağlantı hatası sınıf/ağ nedeniyle doğrulama yapılamadı.' });
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Sadece konsol logu, kullanıcıyı rahatsız etmemeli
    // console.warn(error);
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
            <h1 className="text-3xl font-black text-[var(--primary-gold)] tracking-tight mb-2">QR Bilet Kontrol</h1>
            <p className="text-white/40 text-sm">Seyircinin gösterdiği QR kodu kameraya okutun.</p>
        </div>

        <div className="glass-card w-full max-w-lg p-4 relative overflow-hidden">
            {/* The html5-qrcode library injects HTML here */}
            {/* We add global css override for it to look decent within dark mode */}
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:w-full [&_button]:bg-white/10 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:mt-4 [&_button]:hover:bg-white/20 [&_select]:bg-black [&_select]:text-white [&_select]:border-white/20 [&_select]:rounded-lg [&_select]:p-2 [&_a]:hidden bg-transparent border-none!"></div>

            {loading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="text-[var(--primary-gold)] text-xl font-bold animate-pulse">DOĞRULANIYOR...</div>
                </div>
            )}
        </div>

        {verification && (
            <div className={`w-full max-w-lg p-8 rounded-3xl text-center shadow-2xl animate-fade-in ${
                verification.type === 'success' 
                    ? 'bg-green-500/20 border-2 border-green-500 box-shadow-[0_0_50px_rgba(34,197,94,0.3)]' 
                    : 'bg-red-500/20 border-2 border-red-500 box-shadow-[0_0_50px_rgba(239,68,68,0.3)]'
            }`}>
               <ion-icon 
                   name={verification.type === 'success' ? 'checkmark-circle' : 'close-circle'} 
                   style={{ fontSize: '5rem', color: verification.type === 'success' ? '#4ade80' : '#f87171' }}
               ></ion-icon>
               
               <h3 className={`text-2xl font-black mt-4 uppercase ${verification.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                   {verification.type === 'success' ? 'BAŞARILI' : 'REDDEDİLDİ'}
               </h3>
               
               <p className="text-white/80 font-medium text-lg mt-2 mb-8">{verification.text}</p>
               
               <button 
                  onClick={resumeScanning}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all"
               >
                   Sıradaki Bileti Okut
               </button>
            </div>
        )}
      </div>
    </div>
  );
}
