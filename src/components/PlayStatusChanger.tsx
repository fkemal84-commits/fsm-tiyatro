'use client';

import { useState } from 'react';
import { updatePlayStatus } from '@/app/actions';

export default function PlayStatusChanger({ playId, initialStatus }: { playId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus || 'ACTIVE');
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('playId', playId);
    formData.append('status', newStatus);

    await updatePlayStatus(formData);
    setStatus(newStatus);
    setLoading(false);
  };

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        padding: '0.25rem 0.6rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        border: '1px solid var(--border-medium)',
        background: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : status === 'UPCOMING' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        color: status === 'ACTIVE' ? '#10b981' : status === 'UPCOMING' ? '#38bdf8' : 'var(--text-dim)',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      <option value="ACTIVE" style={{ background: '#18181b', color: '#10b981' }}>🎭 Sahnede</option>
      <option value="UPCOMING" style={{ background: '#18181b', color: '#38bdf8' }}>✨ Yakında</option>
      <option value="ARCHIVED" style={{ background: '#18181b', color: '#a1a1aa' }}>🏛️ Arşiv</option>
    </select>
  );
}
