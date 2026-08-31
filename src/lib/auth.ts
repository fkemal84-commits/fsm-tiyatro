import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminDb } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { normalizeUser } from "@/lib/auth-helpers";

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
        const rawUserData = userDoc.data();

        const isPasswordValid = await bcrypt.compare(credentials.password, rawUserData.password);
        if (!isPasswordValid) return null;

        // Normalizasyon ile garantili statüler elde et
        const normalized = normalizeUser({ id: userDoc.id, ...rawUserData });

        // Onay bekleyen veya onaylanmamış kullanıcıları engelle
        if (normalized.membership_status === 'PENDING') return null;

        const isAdminEntry = credentials.isAdminEntry === "true";
        const isAdminMode = ['ADMIN', 'SUPERADMIN'].includes(normalized.role) || isAdminEntry;

        return {
          id: userDoc.id,
          email: normalized.email,
          name: `${normalized.name} ${normalized.surname}`.trim(),
          role: normalized.role,
          membership_status: normalized.membership_status,
          student_status: normalized.student_status,
          titles: normalized.titles || [],
          displayTitle: normalized.displayTitle || '',
          isAdminMode: isAdminMode
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.membership_status = (user as any).membership_status;
        token.student_status = (user as any).student_status;
        token.titles = (user as any).titles || [];
        token.displayTitle = (user as any).displayTitle || '';
        token.isAdminMode = (user as any).isAdminMode;
      }
      // UPDATE TETİKLEYİCİSİ: session.update() çağrıldığında JWT'yi güncelle
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.membership_status) token.membership_status = session.membership_status;
        if (session.student_status) token.student_status = session.student_status;
        if (session.titles) token.titles = session.titles;
        if (session.displayTitle) token.displayTitle = session.displayTitle;
        if (session.isAdminMode !== undefined) token.isAdminMode = session.isAdminMode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).membership_status = token.membership_status;
        (session.user as any).student_status = token.student_status;
        (session.user as any).titles = (token as any).titles || [];
        (session.user as any).displayTitle = (token as any).displayTitle || '';
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
