'use client';

import { useState } from 'react';
import { toggleLike, addComment } from '@/app/actions';

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  author?: string;
  authorEmail: string;
  authorPhoto?: string;
  authorTitle?: string;
  photoUrl?: string;
  createdAt: string;
}

export default function BlogInteractions({ 
  postId, 
  initialLikes, 
  initialComments, 
  currentUserEmail 
}: { 
  postId: string, 
  initialLikes: string[], 
  initialComments: Comment[], 
  currentUserEmail?: string 
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  const isLiked = currentUserEmail ? likes.includes(currentUserEmail.toLowerCase()) : false;

  async function handleLike() {
    if (!currentUserEmail) return alert("Beğenmek için üye girişi yapmalısınız.");
    if (isLiking) return;
    
    setIsLiking(true);
    const res = await toggleLike(postId);
    
    if ((res as any)?.success && (res as any).likes) {
      setLikes((res as any).likes);
    }
    setIsLiking(false);
  }

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUserEmail) return alert("Yorum yapmak için üye girişi yapmalısınız.");
    setCommentLoading(true);
    setCommentError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await addComment(formData);
    
    if (res && 'error' in res && res.error) setCommentError(res.error);
    else (e.target as HTMLFormElement).reset();
    
    setCommentLoading(false);
  }

  return (
    <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
      {/* BEĞENİ BUTONU */}
      <div className="flex items-center gap-6 mb-10 flex-wrap">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 transform active:scale-95 cursor-pointer font-bold text-xs uppercase tracking-wider ${
            isLiked 
            ? 'bg-[var(--primary-gold)] text-black shadow-md' 
            : 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
          }`}
        >
          <ion-icon name={isLiked ? "heart" : "heart-outline"} style={{ fontSize: '1.25rem', color: isLiked ? '#000' : 'var(--primary-gold)' }}></ion-icon>
          <span>{likes.length} Beğeni</span>
        </button>
        <p className="text-[var(--text-muted)] text-xs italic">Bu yazı {likes.length} kişi tarafından beğenildi.</p>
      </div>

      {/* YORUMLAR */}
      <div className="space-y-6">
        <h3 className="serif-font text-2xl text-[var(--text-main)]">Okur ve Ekip Yorumları ({initialComments.length})</h3>
        
        {currentUserEmail ? (
          <form onSubmit={handleCommentSubmit} className="relative">
            <input type="hidden" name="postId" value={postId} />
            <textarea 
              name="content" 
              placeholder="Yazı hakkındaki düşüncelerinizi paylaşın..." 
              required
              rows={3}
              className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-medium)] text-[var(--text-main)] focus:border-[var(--primary-gold)] transition-all resize-none outline-none text-sm"
            ></textarea>
            <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
              <span className="text-[var(--text-dim)] text-[11px]">Kulüp topluluk kurallarına uygun yorumlar onaylanır.</span>
              <button 
                type="submit" 
                disabled={commentLoading}
                className="btn btn-primary py-2 px-6 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
              >
                {commentLoading ? 'Gönderiliyor...' : 'Yorum Yap'}
              </button>
            </div>
            {commentError && <p className="text-[#ef4444] text-xs mt-2 font-bold">{commentError}</p>}
          </form>
        ) : (
          <div className="p-6 bg-[var(--bg-surface-elevated)] rounded-xl border border-dashed border-[var(--border-medium)] text-center">
            <p className="text-[var(--text-muted)] text-sm">Yorum yapabilmek için lütfen üye girişi yapınız.</p>
          </div>
        )}

        <div className="space-y-4 mt-8">
          {initialComments.length === 0 ? (
            <p className="text-[var(--text-dim)] italic text-sm text-center py-6">Henüz bir yorum bulunmuyor. İlk yorumu siz yapın!</p>
          ) : (
            initialComments.map((c) => {
              const name = c.authorName || c.author || c.authorEmail.split('@')[0];
              const photo = c.authorPhoto || ('error' in c ? undefined : (c as any).photoUrl) || "/default-avatar.svg";
              return (
                <div key={c.id} className="flex gap-3.5 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--primary-gold-border)]">
                    <img 
                      src={photo} 
                      alt={name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--text-main)] font-bold text-sm">{name}</span>
                        {c.authorTitle && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] border border-[var(--primary-gold-border)] font-semibold">
                            {c.authorTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--text-dim)] text-xs">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[var(--text-muted)] text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
