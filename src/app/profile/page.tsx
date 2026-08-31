import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  // Zengin profil verilerini yansıtmak için veritabanından güncel kartı al
  const snapshot = await adminDb.collection('users').where('email', '==', session.user?.email || "").limit(1).get();
  if (snapshot.empty) return redirect('/login');

  const rawData = snapshot.docs[0].data();
  const normalized = normalizeUser({ id: snapshot.docs[0].id, ...rawData });

  const user = { 
    ...normalized,
    id: snapshot.docs[0].id, 
    name: normalized.name,
    surname: normalized.surname,
    email: normalized.email,
    role: normalized.role,
    membership_status: normalized.membership_status,
    student_status: normalized.student_status,
    original_school_email: rawData.original_school_email || null,
    email_changed_once: rawData.email_changed_once || false,
    email_changed_at: rawData.email_changed_at || null,
    phone: rawData.phone || '',
    photoUrl: rawData.photoUrl || '',
    department: rawData.department || '',
    hobbies: rawData.hobbies || '',
    pastPlays: rawData.pastPlays || '',
    skills: rawData.skills || '',
    bio: rawData.bio || '',
    createdAt: normalized.createdAt
  };

  return <ProfileClient user={user} />;
}
