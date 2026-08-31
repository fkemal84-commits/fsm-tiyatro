export function getWhatsAppRehearsalLink(rehearsal: any) {
  const text = `🎭 *FSM TİYATRO | YENİ PROVA!* 🎭\n\n📌 *Konu:* ${rehearsal.title}\n⏰ *Zaman:* ${rehearsal.date}\n📍 *Mekan:* ${rehearsal.location}\n\n📝 *Not:* ${rehearsal.notes || 'Belirtilmedi.'}\n\n📲 *Detaylar için:* https://fsm-tiyatro.vercel.app/members/rehearsals`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppEventLink(event: any) {
  const text = `📢 *FSM TİYATRO | YENİ ETKİNLİK!* 📢\n\n✨ *${event.title}*\n⏰ *Zaman:* ${event.date}\n📍 *Mekan:* ${event.location}\n\n👉 *Katılmak için tıkla:* https://fsm-tiyatro.vercel.app/members`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppNudgeLink() {
  const messages = [
    "🎭 *YÖNETMEN ŞAKASI:* Beyler/Bayanlar, ezberler ne alemde? Reji masasında bekliyoruz! 🎬👀",
    "🎬 *DÜRTME:* Ezber geçmeyen var mı? Akşam provada 'unuttum' diyeni sahneye asarız, haberiniz olsun! 😂🎭",
    "🎭 *REJİ NOTU:* Ezberler su gibi olsun arkadaşlar. Sahne sizi bekler, suflörünüz ise emekli oldu! 🌊😂",
    "📢 *YÖNETMEN:* Bugün ezbersiz gelenlere ceza olarak bütün dekora boya yaptıracağım! Ona göre gelin! 🎨🎭"
  ];
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  return `https://wa.me/?text=${encodeURIComponent(randomMsg)}`;
}

/**
 * Yazar ismini soyadsız ve iki isim varsa ikisini de koruyarak "[Ad(lar)] yazdı" formatına dönüştürür.
 * Örn: "Furkan Kemal Teker" -> "Furkan Kemal yazdı"
 * Örn: "Furkan Teker" -> "Furkan yazdı"
 * Örn: "FSM Tiyatro" -> "FSM Tiyatro yazdı"
 */
export function formatAuthorSignature(author?: string | null): string {
  if (!author || !author.trim()) return 'FSM Tiyatro yazdı';
  const trimmed = author.trim();
  if (trimmed.toLowerCase().includes('fsm tiyatro')) return 'FSM Tiyatro yazdı';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0]} yazdı`;
  }
  // İki veya daha fazla kelime varsa, son kelime soyadıdır; önceki tüm ilk isimleri al
  const givenNames = parts.slice(0, -1).join(' ');
  return `${givenNames} yazdı`;
}

