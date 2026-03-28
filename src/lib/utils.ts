export function getWhatsAppRehearsalLink(rehearsal: any) {
  const text = `🎭 *FSM TİYATRO | YENİ PROVA!* 🎭\n\n📌 *Konu:* ${rehearsal.title}\n⏰ *Zaman:* ${rehearsal.date}\n📍 *Mekan:* ${rehearsal.location}\n\n📝 *Not:* ${rehearsal.notes || 'Belirtilmedi.'}\n\n📲 *Detaylar için:* https://fsm-tiyatro.vercel.app/members/rehearsals`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppEventLink(event: any) {
  const text = `📢 *FSM TİYATRO | YENİ ETKİNLİK!* 📢\n\n✨ *${event.title}*\n⏰ *Zaman:* ${event.date}\n📍 *Mekan:* ${event.location}\n\n👉 *Katılmak için tıkla:* https://fsm-tiyatro.vercel.app/members`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
