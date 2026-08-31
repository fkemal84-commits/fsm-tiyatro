import { adminDb } from '../src/lib/firebase-admin';
import { normalizeUser } from '../src/lib/auth-helpers';

async function runMigration() {
  const isDryRun = process.env.DRY_RUN !== 'false';
  console.log(`\n🚀 [FAZ 1 MIGRATION] Başlatılıyor... Mod: ${isDryRun ? 'DRY-RUN (Yalnızca Raporlama)' : 'LIVE (Firestore Güncelleme)'}\n`);

  try {
    const usersSnap = await adminDb.collection('users').get();
    console.log(`📦 Toplam kullanıcı sayısı: ${usersSnap.size}`);

    let needsUpdateCount = 0;
    let alreadyNormalizedCount = 0;
    const updates: Array<{ id: string; email: string; current: any; target: any }> = [];

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const hasMembership = data.membership_status !== undefined && data.membership_status !== null;
      const hasStudent = data.student_status !== undefined && data.student_status !== null;

      if (hasMembership && hasStudent) {
        alreadyNormalizedCount++;
      } else {
        needsUpdateCount++;
        const normalized = normalizeUser({ id: doc.id, ...data });
        updates.push({
          id: doc.id,
          email: data.email || doc.id,
          current: {
            role: data.role,
            membership_status: data.membership_status,
            student_status: data.student_status
          },
          target: {
            membership_status: normalized.membership_status,
            student_status: normalized.student_status
          }
        });
      }
    }

    console.log(`✅ Zaten güncel kayıtlar: ${alreadyNormalizedCount}`);
    console.log(`📝 Güncelleme gereken kayıtlar: ${needsUpdateCount}`);

    if (updates.length > 0) {
      console.log('\n--- Güncellenecek Kayıtlar Listesi ---');
      updates.forEach((u, i) => {
        console.log(`[${i + 1}/${updates.length}] ${u.email} (ID: ${u.id})`);
        console.log(`   Eski: role="${u.current.role}" | membership="${u.current.membership_status}" | student="${u.current.student_status}"`);
        console.log(`   Yeni: membership_status="${u.target.membership_status}" | student_status="${u.target.student_status}"`);
      });

      if (!isDryRun) {
        console.log('\n⏳ Firestore dökümanları güncelleniyor...');
        const batch = adminDb.batch();
        let batchCount = 0;

        for (const u of updates) {
          const ref = adminDb.collection('users').doc(u.id);
          batch.update(ref, {
            membership_status: u.target.membership_status,
            student_status: u.target.student_status,
            membership_updated_at: new Date().toISOString(),
            membership_updated_by: 'FAZ_1_MIGRATION_SCRIPT'
          });
          batchCount++;
        }

        await batch.commit();
        console.log(`🎉 Başarıyla ${batchCount} kullanıcı güncellendi!`);
      } else {
        console.log('\n💡 DRY-RUN modu aktif olduğu için veritabanına yazılmadı. Gerçek güncelleme için DRY_RUN=false ile çalıştırın.');
      }
    } else {
      console.log('✨ Tüm kayıtlar zaten yeni veri modeline uygun!');
    }
  } catch (error) {
    console.error('❌ Migration sırasında hata:', error);
  }
}

runMigration().then(() => {
  console.log('\n🏁 Migration işlemi tamamlandı.\n');
  process.exit(0);
});
