'use client';

import { useTransition } from 'react';
import { changeUserRole } from '@/app/actions';

interface RoleSelectorProps {
  userId: string;
  currentRole: string;
  currentUserRole: string;
}

export default function RoleSelector({ userId, currentRole, currentUserRole }: RoleSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const roleColors: Record<string, string> = {
    SUPERADMIN: '#ef4444',
    ADMIN: 'var(--primary-gold)',
    DIRECTOR: '#38bdf8',
    ASST_DIRECTOR: '#818cf8',
    EDITOR: '#f59e0b',
    SALES: '#10b981',
    AKTOR: '#ec4899',
    MEMBER: 'var(--text-muted)',
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (!newRole || newRole === currentRole) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('newRole', newRole);
      await changeUserRole(formData);
    });
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: isPending ? 0.6 : 1 }}>
      <select
        defaultValue={currentRole}
        onChange={handleRoleChange}
        disabled={isPending}
        style={{
          padding: '0.35rem 0.6rem',
          borderRadius: '6px',
          background: 'var(--input-bg)',
          color: roleColors[currentRole] || 'var(--text-main)',
          border: '1px solid var(--border-medium)',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          cursor: isPending ? 'wait' : 'pointer',
          outline: 'none',
        }}
      >
        {currentUserRole === 'SUPERADMIN' && <option value="SUPERADMIN">Süper Admin</option>}
        {currentUserRole === 'SUPERADMIN' && <option value="ADMIN">Admin</option>}
        <option value="DIRECTOR">Yönetmen</option>
        <option value="ASST_DIRECTOR">Yrd. Yönetmen</option>
        <option value="EDITOR">Editör</option>
        <option value="SALES">Satış / Gişe</option>
        <option value="AKTOR">Aktör</option>
        <option value="MEMBER">Üye</option>
      </select>
      {isPending && (
        <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)' }}>⏳</span>
      )}
    </div>
  );
}
