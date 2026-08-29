'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, handleServerError } from './common';

export async function addTicket(formData: FormData) {
  const name = formData.get('name') as string;
  const surname = formData.get('surname') as string;
  const identifier = formData.get('identifier') as string;
  const row = formData.get('row') as string | null;
  const seatNumber = formData.get('seatNumber') as string | null;
  const reference = formData.get('reference') as string | null;

  if (!name || !surname || !identifier) {
    return { error: 'İsim, soyisim ve telefon/öğrenci numarası alanları zorunludur.' };
  }

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'SALES']);

    // Koltuk çakışma kontrolü (Eğer koltuk belirtilmişse)
    if (row && seatNumber) {
      const existingSeat = await adminDb.collection('tickets')
        .where('row', '==', row)
        .where('seatNumber', '==', seatNumber)
        .where('status', '==', 'VALID')
        .limit(1)
        .get();

      if (!existingSeat.empty) {
        return { error: `Sıra: ${row}, Koltuk: ${seatNumber} daha önce başka bir seyirciye satılmış!` };
      }
    }

    const docRef = await adminDb.collection('tickets').add({
      name: name.trim(),
      surname: surname.trim(),
      identifier: identifier.trim(),
      row: row ? row.trim() : null,
      seatNumber: seatNumber ? seatNumber.trim() : null,
      reference: reference ? reference.trim() : null,
      status: 'VALID',
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members/tickets');
    revalidatePath('/biletimi-bul');
    return { success: true, ticketId: docRef.id };
  } catch (error) {
    return handleServerError(error, "ADD_TICKET");
  }
}

export async function updateTicketReference(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const reference = formData.get('reference') as string;

  if (!ticketId) return { error: 'Bilet ID bulunamadı.' };

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'SALES']);

    await adminDb.collection('tickets').doc(ticketId).update({
      reference: reference ? reference.trim() : null
    });

    revalidatePath('/members/tickets');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_TICKET_REFERENCE");
  }
}

export async function findTicket(formData: FormData) {
  const name = formData.get('name') as string;
  const surname = formData.get('surname') as string;

  if (!name || !surname) {
    return { error: 'Lütfen adınızı ve soyadınızı eksiksiz giriniz.' };
  }

  try {
    const trimmedName = name.trim().toLowerCase();
    const trimmedSurname = surname.trim().toLowerCase();

    const snapshot = await adminDb.collection('tickets').get();
    const matchedTickets: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const docName = (data.name || '').trim().toLowerCase();
      const docSurname = (data.surname || '').trim().toLowerCase();

      if (docName === trimmedName && docSurname === trimmedSurname) {
        matchedTickets.push({
          id: doc.id,
          name: data.name,
          surname: data.surname,
          row: data.row || null,
          seatNumber: data.seatNumber || null,
          status: data.status || 'VALID',
          createdAt: data.createdAt
        });
      }
    });

    if (matchedTickets.length === 0) {
      return { error: 'Girilen ad ve soyada ait kayıtlı bilet bulunamadı. Lütfen bilgilerinizi kontrol ediniz.' };
    }

    return { success: true, tickets: matchedTickets };
  } catch (error) {
    return handleServerError(error, "FIND_TICKET");
  }
}

export async function verifyTicket(ticketId: string) {
  if (!ticketId) return { error: 'Bilet ID geçersiz.' };

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'SALES']);

    const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
    if (!ticketDoc.exists) {
      return { error: 'Bilet sistemde bulunamadı!' };
    }

    const data = ticketDoc.data()!;
    if (data.status === 'USED') {
      return { error: `Bu bilet daha önce kullanılmış! (Seyirci: ${data.name} ${data.surname})` };
    }

    await ticketDoc.ref.update({
      status: 'USED',
      usedAt: new Date().toISOString()
    });

    revalidatePath('/members/tickets');
    revalidatePath('/biletimi-bul');
    return { 
      success: true, 
      message: `Giriş Onaylandı! Hoş geldiniz, ${data.name} ${data.surname}. ${data.row ? `Sıra: ${data.row}, Koltuk: ${data.seatNumber}` : ''}`
    };
  } catch (error) {
    return handleServerError(error, "VERIFY_TICKET");
  }
}

export async function deleteTicket(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) return { error: 'Bilet ID bulunamadı.' };

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'SALES']);
    await adminDb.collection('tickets').doc(ticketId).delete();
    revalidatePath('/members/tickets');
    revalidatePath('/biletimi-bul');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "DELETE_TICKET");
  }
}

export async function getOccupiedSeats() {
  try {
    const snapshot = await adminDb.collection('tickets')
      .where('status', '==', 'VALID')
      .get();

    const seats: Array<{ row: string; seatNumber: string; ticketHolder?: string }> = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.row && data.seatNumber) {
        seats.push({
          row: data.row,
          seatNumber: data.seatNumber,
          ticketHolder: `${data.name} ${data.surname}`
        });
      }
    });

    return { success: true, seats };
  } catch (error) {
    return handleServerError(error, "GET_OCCUPIED_SEATS");
  }
}
