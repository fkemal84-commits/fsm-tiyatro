import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TicketClientView from './TicketClientView';

export const dynamic = 'force-dynamic';

export default async function TicketManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  const role = (session.user as any).role;
  if (!['SUPERADMIN', 'ADMIN', 'SALES'].includes(role)) {
    redirect('/');
  }

  // Biletleri Firestore'dan çek (En yeni en üstte)
  const snapshot = await adminDb.collection('tickets').get();
  
  const tickets = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      surname: data.surname || '',
      identifier: data.identifier || '',
      row: data.row || null,
      seatNumber: data.seatNumber || null,
      status: data.status || 'VALID',
      createdAt: data.createdAt || new Date().toISOString()
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <TicketClientView initialTickets={tickets} />;
}
