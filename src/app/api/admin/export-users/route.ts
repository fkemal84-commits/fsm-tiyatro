import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const url = new URL(request.url);
    const selectedYear = url.searchParams.get('year'); // örn: '2026' veya 'all'
    const exportFormat = url.searchParams.get('format') || 'csv'; // 'csv' veya 'vcf'

    const usersSnap = await adminDb.collection('users').get();

    let users = usersSnap.docs.map(doc => {
      const d = doc.data();
      const createdAt = d.createdAt || '';
      
      // Yıl tespiti: registrationYear varsa kullan, yoksa createdAt tarihinden al
      let userYear = d.registrationYear || '';
      if (!userYear && createdAt) {
        try {
          userYear = new Date(createdAt).getFullYear().toString();
        } catch {
          userYear = '2026';
        }
      }

      // Telefon numarası temizleme & WhatsApp formatı
      let rawDigits = (d.rawPhone || d.phone || '').replace(/\D/g, '');
      if (rawDigits.startsWith('90') && rawDigits.length === 12) {
        rawDigits = rawDigits.slice(2);
      } else if (rawDigits.startsWith('0') && rawDigits.length === 11) {
        rawDigits = rawDigits.slice(1);
      }

      const whatsappNumber = rawDigits.length === 10 ? `+90${rawDigits}` : (d.phone || '');
      const formattedDisplayPhone = rawDigits.length === 10 
        ? `0${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6, 8)} ${rawDigits.slice(8, 10)}`
        : (d.phone || '');
      const whatsappLink = rawDigits.length === 10 ? `https://wa.me/90${rawDigits}` : '';

      return {
        id: doc.id,
        name: (d.name || '').trim(),
        surname: (d.surname || '').trim(),
        email: (d.email || '').trim(),
        phone: whatsappNumber,
        formattedPhone: formattedDisplayPhone,
        rawPhone: rawDigits,
        whatsappLink,
        department: d.department || '',
        role: d.role || 'MEMBER',
        titles: Array.isArray(d.titles) ? d.titles.join('; ') : '',
        registrationYear: userYear,
        academicYear: d.academicYear || `${userYear}-${Number(userYear) + 1 || 2027}`,
        createdAt,
      };
    });

    // Yıla göre filtrele
    if (selectedYear && selectedYear !== 'all') {
      users = users.filter(u => u.registrationYear === selectedYear);
    }

    // Tarihe göre yeniden eskiye sırala
    users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // 1. FORMAT: vCard (.vcf) — TELEFON REHBERİNE TEK TIKLA AKTARMA
    if (exportFormat === 'vcf') {
      const vcfContent = users.map(u => {
        const fullName = `${u.name} ${u.surname}`.trim() || 'FSM Tiyatro Üyesi';
        const vcfOrg = 'FSM Tiyatro';
        const vcfTitle = [u.registrationYear ? `${u.registrationYear} Kaydı` : '', u.department, u.titles].filter(Boolean).join(' - ');
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${fullName}`,
          `N:${u.surname};${u.name};;;`,
          u.phone ? `TEL;TYPE=CELL,VOICE:${u.phone}` : '',
          u.email ? `EMAIL;TYPE=INTERNET:${u.email}` : '',
          `ORG:${vcfOrg}`,
          vcfTitle ? `TITLE:${vcfTitle}` : '',
          `NOTE:FSM Tiyatro ${u.registrationYear || ''} Kayıt Standı. Bölüm: ${u.department || 'Belirtilmedi'}. Rol: ${u.role}`,
          'END:VCARD'
        ].filter(Boolean).join('\r\n');
      }).join('\r\n');

      const yearLabel = selectedYear && selectedYear !== 'all' ? `-${selectedYear}` : '';
      return new NextResponse(vcfContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/vcard; charset=utf-8',
          'Content-Disposition': `attachment; filename="fsm-tiyatro-rehber${yearLabel}.vcf"`,
        },
      });
    }

    // 2. FORMAT: CSV — EXCEL / GOOGLE SHEETS / WHATSAPP İÇİN
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

    const BOM = '\uFEFF';
    const header = [
      'Ad',
      'Soyad',
      'Tam Ad',
      'Telefon (Rehber/WhatsApp Formatı)',
      'Okunabilir Telefon',
      'Doğrudan WhatsApp Sohbet Linki',
      'E-Posta',
      'Bölüm',
      'Kayıt Yılı',
      'Akademik Dönem',
      'Yetki Rolü',
      'Kulüp Görev ve Unvanları',
      'Kayıt Tarihi'
    ].join(',');

    const rows = users.map(u => {
      const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '';
      const fullName = `${u.name} ${u.surname}`.trim();
      return [
        escapeCsv(u.name),
        escapeCsv(u.surname),
        escapeCsv(fullName),
        escapeCsv(u.phone), // +905xxxxxxxxx formatı
        escapeCsv(u.formattedPhone), // 05xx xxx xx xx
        escapeCsv(u.whatsappLink), // https://wa.me/...
        escapeCsv(u.email),
        escapeCsv(u.department),
        escapeCsv(u.registrationYear),
        escapeCsv(u.academicYear),
        escapeCsv(roleLabels[u.role] || u.role),
        escapeCsv(u.titles),
        escapeCsv(dateStr),
      ].join(',');
    });

    const csv = BOM + header + '\n' + rows.join('\n');
    const yearLabel = selectedYear && selectedYear !== 'all' ? `-${selectedYear}` : '';

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fsm-tiyatro-uyeler${yearLabel}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[EXPORT_USERS] Hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
