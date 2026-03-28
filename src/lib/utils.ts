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
