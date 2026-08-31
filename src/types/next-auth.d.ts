import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { MembershipStatus, StudentStatus, UserRole } from "./domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | string;
      membership_status?: MembershipStatus | string;
      student_status?: StudentStatus | string;
      titles?: string[];
      displayTitle?: string;
      isAdminMode: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: UserRole | string;
    membership_status?: MembershipStatus | string;
    student_status?: StudentStatus | string;
    titles?: string[];
    displayTitle?: string;
    isAdminMode: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole | string;
    membership_status?: MembershipStatus | string;
    student_status?: StudentStatus | string;
    titles?: string[];
    displayTitle?: string;
    isAdminMode?: boolean;
  }
}

