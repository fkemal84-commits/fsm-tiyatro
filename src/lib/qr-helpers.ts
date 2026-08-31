import crypto from 'crypto';

/**
 * QR Kodu için HMAC imzalı token üretir
 */
export function generateQRToken(eventId: string, sessionId: string, qrSecret: string, timestamp = Date.now()): string {
  const payload = `${eventId}|${sessionId}|${timestamp}`;
  const signature = crypto.createHmac('sha256', qrSecret).update(payload).digest('hex').slice(0, 16);
  return `FSM-ATT:${eventId}:${sessionId}:${timestamp}:${signature}`;
}

/**
 * QR Token'ının imzasını ve doğruluğunu kontrol eder
 */
export function verifyQRTokenSignature(token: string, qrSecret: string): { valid: boolean; eventId?: string; sessionId?: string; timestamp?: number } {
  if (!token || !token.startsWith('FSM-ATT:')) {
    return { valid: false };
  }

  const parts = token.split(':');
  if (parts.length !== 5) {
    return { valid: false };
  }

  const [, eventId, sessionId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return { valid: false };

  const expectedPayload = `${eventId}|${sessionId}|${timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', qrSecret).update(expectedPayload).digest('hex').slice(0, 16);

  if (signature !== expectedSignature) {
    return { valid: false };
  }

  return { valid: true, eventId, sessionId, timestamp };
}
