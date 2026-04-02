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
  const user = snapshot.empty ? null : { 
    id: snapshot.docs[0].id, 
    name: snapshot.docs[0].data().name,
    surname: snapshot.docs[0].data().surname,
    email: snapshot.docs[0].data().email,
    role: snapshot.docs[0].data().role,
    phone: snapshot.docs[0].data().phone || '',
    photoUrl: snapshot.docs[0].data().photoUrl || '',
    department: snapshot.docs[0].data().department || '',
    hobbies: snapshot.docs[0].data().hobbies || '',
    pastPlays: snapshot.docs[0].data().pastPlays || '',
    skills: snapshot.docs[0].data().skills || '',
    bio: snapshot.docs[0].data().bio || '',
    createdAt: snapshot.docs[0].data().createdAt || ''
  };

  return <ProfileClient user={user} />;
}
