'use client';

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name: string;
  confirmMessage: string;
  idFieldName: string;
}

export default function DeleteButton({ action, id, name, confirmMessage, idFieldName }: DeleteButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name={idFieldName} value={id} />
      <button 
        type="submit" 
        className="btn btn-outline" 
        style={{ color: '#ff4d4d', borderColor: '#ff4d4d', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
        onClick={(e) => {
          if (!confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        Kaldır
      </button>
    </form>
  );
}
