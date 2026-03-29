'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name: string;
  confirmMessage: string;
  idFieldName: string;
}

export default function DeleteButton({ action, id, name, confirmMessage, idFieldName }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#ff4d4d', fontWeight: 'bold' }}>Emin misin?</span>
        <form action={async (fd) => { await action(fd); }}>
          <input type="hidden" name={idFieldName} value={id} />
          <button 
            type="submit" 
            className="btn" 
            style={{ 
              padding: '0.2rem 0.5rem', 
              fontSize: '0.7rem', 
              background: '#ff4d4d', 
              color: '#fff',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Evet, Sil
          </button>
        </form>
        <button 
          onClick={() => setIsConfirming(false)} 
          className="btn btn-outline"
          style={{ 
            padding: '0.2rem 0.5rem', 
            fontSize: '0.7rem', 
            borderColor: 'var(--text-muted)',
            borderRadius: '4px'
          }}
        >
          İptal
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsConfirming(true)}
      className="btn btn-outline" 
      style={{ color: '#ff4d4d', borderColor: '#ff4d4d', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
    >
      Kaldır
    </button>
  );
}
