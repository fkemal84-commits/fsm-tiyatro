'use client';

import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
export default function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode,
  session: any
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
