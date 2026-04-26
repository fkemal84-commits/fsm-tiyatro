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
        
        // GİZLİ YOL MANTIĞI: Eğer /tanerabi üzerinden girilmediyse, 
        // Admin/Yönetmen unvanlarını MEMBER olarak sessize al.
        // Ancak AKTOR unvanı her zaman açık kalsın.
        let sessionRole = (realRole === 'AKTOR' || realRole === 'PLAYER') ? realRole : 'MEMBER';
        let isAdminMode = false;
        
        const isManagementRole = ['ADMIN', 'SUPERADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'EDITOR', 'SALES'].includes(realRole as string);

        if (isAdminEntry && isManagementRole) {
          sessionRole = realRole;
          isAdminMode = true;
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
