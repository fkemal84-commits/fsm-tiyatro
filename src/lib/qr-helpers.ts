import crypto from 'crypto';

/**
 * QR Kodu için HMAC imzalı token üretir
 */
export function generateQRToken(eventId: string, sessionId: string, qrSecret: string, timestamp = Date.now()): string {
  const payload = `${eventId}|${sessionId}|${timestamp}`;
  const signature = crypto.createHmac('sha256', qrSecret).update(payload).digest('hex').slice(0, 16);
  return `FSM-ATT:${eventId}:${sessionId}:${timestamp}:${signature}`;
}

export function verifyQRTokenSignature(
  token: string,
  qrSecret: string,
  maxAgeMs: number = 90000 // 90 saniye geçerlilik süresi
): { valid: boolean; error?: string; eventId?: string; sessionId?: string; timestamp?: number } {
  if (!token || !token.startsWith('FSM-ATT:')) {
    return { valid: false, error: 'Geçersiz QR kod formatı.' };
  }

  const parts = token.split(':');
  if (parts.length !== 5) {
    return { valid: false, error: 'Bozuk QR kod yapısı.' };
  }

  const [, eventId, sessionId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return { valid: false, error: 'Geçersiz zaman damgası.' };

  const now = Date.now();
  // Token TTL Doğrulaması: Dönen QR'ın üretilme anından itibaren geçerlilik süresi
  if (maxAgeMs > 0 && Math.abs(now - timestamp) > maxAgeMs) {
    return { valid: false, error: 'QR kodun süresi doldu. Lütfen ekrandaki güncel QR kodu okutunuz.' };
  }

  const expectedPayload = `${eventId}|${sessionId}|${timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', qrSecret).update(expectedPayload).digest('hex').slice(0, 16);

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Geçersiz QR güvenlik imzası.' };
  }

  return { valid: true, eventId, sessionId, timestamp };
}
