import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { adminDb } from "@/lib/firebase-admin";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  // Zengin profil verilerini yansıtmak için veritabanından güncel kartı al
  const snapshot = await adminDb.collection('users').where('email', '==', session.user?.email || "").limit(1).get();
  const user = snapshot.empty ? null : { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as any) };

  return <ProfileClient user={user} />;
}
