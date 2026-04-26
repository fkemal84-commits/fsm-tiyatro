import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminDb } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isAdminEntry: { label: "IsAdminEntry", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        const snapshot = await adminDb.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        // Onay bekleyen kullanıcıları engelle
        if (user.role === 'PENDING') return null;

        const isAdminEntry = credentials.isAdminEntry === "true";
        const realRole = user.role;
        
        let sessionRole = realRole; 
        let isAdminMode = false;
        
        const isManagementRole = ['ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'EDITOR', 'SALES'].includes(realRole as string);

        if (isManagementRole) {
          isAdminMode = true;
        }

        // SUPERADMIN Özel Koruması: Sadece /tanerabi (Gizli Kapı) üzerinden girilince açılır
        if (realRole === 'SUPERADMIN') {
          if (isAdminEntry) {
            isAdminMode = true;
            sessionRole = 'SUPERADMIN';
          } else {
            // Normal yoldan giren bir superadmin'i ADMIN yetkisiyle içeri al (Böylece gişe vb. çalışır)
            // Sadece superadmin'e özel silme gibi yetkiler gizli kalır
            sessionRole = 'ADMIN';
            isAdminMode = true; 
          }
        }

        // İzole edilen veya silinen hesaplar ile üye grubu
        if (realRole === 'MEMBER' || realRole === 'PENDING') {
           isAdminMode = false;
        }

        return { 
          id: userDoc.id, 
          email: user.email, 
          name: `${user.name} ${user.surname}`, 
          role: sessionRole,
          isAdminMode: isAdminMode
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.isAdminMode = (user as any).isAdminMode;
      }
      // UPDATE TETİKLEYİCİSİ: session.update() çağrıldığında JWT'yi güncelle
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.isAdminMode !== undefined) token.isAdminMode = session.isAdminMode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).isAdminMode = token.isAdminMode;
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET || "fsmtiyatro_super_secret_key_2026_x"
};
