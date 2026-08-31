'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { verifyAttendanceViaQR } from '@/app/actions';

export default function AttendanceQRScanner({ onVerified }: { onVerified?: () => void }) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      try {
        const scanner = new Html5QrcodeScanner(
          "attendance-qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          false
        );
        scannerRef.current = scanner;
        scanner.render(handleScanSuccess, handleScanFailure);
      } catch (e) {
        console.warn("[QR_SCANNER] Başlatma hatası:", e);
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (loading) return;

    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch {}
    }

    setScanResult(decodedText);
    setLoading(true);
    setResult(null);

    try {
      const res = await verifyAttendanceViaQR(decodedText);
      if (res && 'error' in res && res.error) {
        setResult({ success: false, message: res.error });
      } else if (res && 'success' in res && res.success) {
        setResult({ success: true, message: res.message || 'Yoklamanız başarıyla doğrulandı!' });
        if (onVerified) onVerified();
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Doğrulama sırasında bağlantı hatası oluştu.' });
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.resume();
          } catch {}
        }
      }, 3000);
    }
  };

  const handleScanFailure = () => {
    // QR henüz kadrajda değilken sessizce devam et
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center">
      <h3 className="serif-font text-lg text-[var(--primary-gold)] font-bold mb-2 flex items-center gap-2">
        <ion-icon name="camera-outline"></ion-icon>
        Fiziksel Yoklama QR Okuyucu
      </h3>
      <p className="text-xs text-zinc-400 text-center max-w-sm mb-4">
        Etkinlik alanında ekranda / afişte gösterilen canlı QR kodu kameranıza hizalayınız.
      </p>

      <div id="attendance-qr-reader" className="w-full max-w-xs rounded-xl overflow-hidden border border-zinc-700 bg-black"></div>

      {loading && (
        <div className="mt-4 text-xs text-[var(--primary-gold)] animate-pulse flex items-center gap-2">
          <ion-icon name="sync-outline" className="animate-spin"></ion-icon>
          Yoklama sunucuda doğrulanıyor...
        </div>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-xs font-bold w-full max-w-xs text-center border ${result.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
          {result.success ? '✓ ' : '✕ '}
          {result.message}
        </div>
      )}
    </div>
  );
}
