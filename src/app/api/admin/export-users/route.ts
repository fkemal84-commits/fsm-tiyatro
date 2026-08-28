import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const usersSnap = await adminDb.collection('users').get();

    const users = usersSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || '',
        surname: d.surname || '',
        email: d.email || '',
        phone: d.phone || '',
        department: d.department || '',
        role: d.role || 'MEMBER',
        createdAt: d.createdAt || '',
      };
    });

    const roleLabels: Record<string, string> = {
      SUPERADMIN: 'Süper Admin',
      ADMIN: 'Admin',
      SALES: 'Satış',
      EDITOR: 'Editör',
      DIRECTOR: 'Yönetmen',
      ASST_DIRECTOR: 'Yrd. Yönetmen',
      AKTOR: 'Aktör',
      MEMBER: 'Üye',
      PENDING: 'Onay Bekliyor',
    };

    // BOM for Excel UTF-8 compat
    const BOM = '\uFEFF';
    const header = 'Ad,Soyad,E-Posta,Telefon,Bölüm,Rol,Kayıt Tarihi';

    const rows = users.map(u => {
      const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '';
      return [
        escapeCsv(u.name),
        escapeCsv(u.surname),
        escapeCsv(u.email),
        escapeCsv(u.phone),
        escapeCsv(u.department),
        escapeCsv(roleLabels[u.role] || u.role),
        escapeCsv(dateStr),
      ].join(',');
    });

    const csv = BOM + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fsm-tiyatro-uyeler-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[EXPORT_USERS] Hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
