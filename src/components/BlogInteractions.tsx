'use client';

import { useState } from 'react';
import { toggleLike, addComment } from '@/app/actions';

interface Comment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
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
    if (!currentUserEmail) return alert("Beğenmek için giriş yapmalısınız.");
    if (isLiking) return;
    
    setIsLiking(true);
    const res = await toggleLike(postId);
    
    if (res?.success) {
      if (res.isLiked) {
        setLikes([...likes, currentUserEmail.toLowerCase()]);
      } else {
        setLikes(likes.filter(e => e !== currentUserEmail.toLowerCase()));
      }
    }
    setIsLiking(false);
  }

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUserEmail) return alert("Yorum yapmak için giriş yapmalısınız.");
    setCommentLoading(true);
    setCommentError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await addComment(formData);
    
    if (res?.error) setCommentError(res.error);
    else (e.target as HTMLFormElement).reset();
    
    setCommentLoading(false);
  }

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      {/* APPLAUSE SECTION */}
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-500 transform active:scale-95 ${
            isLiked 
            ? 'bg-[var(--primary-gold)] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
            : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          <ion-icon name={isLiked ? "heart" : "heart-outline"} style={{ fontSize: '1.5rem' }}></ion-icon>
          <span className="font-bold">{likes.length} Alkış</span>
        </button>
        <p className="text-[var(--text-muted)] text-sm italic">Bu yazı ekip tarafından {likes.length} kez alkışlandı.</p>
      </div>

      {/* COMMENTS SECTION */}
      <div className="space-y-8">
        <h3 className="serif-font text-2xl text-white">Kulis Fısıltıları ({initialComments.length})</h3>
        
        {currentUserEmail ? (
          <form onSubmit={handleCommentSubmit} className="relative">
            <input type="hidden" name="postId" value={postId} />
            <textarea 
              name="content" 
              placeholder="Sahnede konuşulmayanları buraya fısılda..." 
              required
              rows={2}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-[var(--primary-gold)] transition-all resize-none"
            ></textarea>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Sahne arkası kurallarına uymayı unutmayın.</span>
              <button 
                type="submit" 
                disabled={commentLoading}
                className="bg-white/5 hover:bg-[var(--primary-gold)] hover:text-black text-white px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest"
              >
                {commentLoading ? 'Fısıldanıyor...' : 'Yayınla'}
              </button>
            </div>
            {commentError && <p className="text-[var(--accent-red)] text-xs mt-2">{commentError}</p>}
          </form>
        ) : (
          <div className="p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
            <p className="text-[var(--text-muted)] text-sm">Yorum yapabilmek için kulübe giriş yapmalısınız.</p>
          </div>
        )}

        <div className="space-y-6 mt-10">
          {initialComments.length === 0 ? (
            <p className="text-[var(--text-muted)] italic text-sm text-center py-6">Henüz bir fısıltı yok. Sessizliği sen boz!</p>
          ) : (
            initialComments.map((c) => (
              <div key={c.id} className="flex gap-4 group animate-fadeUp">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--primary-gold-dim)]">
                  <img 
                    src={c.photoUrl || "/default-avatar.svg"} 
                    alt={c.author} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold text-sm tracking-tight">{c.author}</span>
                    <span className="text-[var(--text-muted)] text-[10px]">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl rounded-tl-none border border-white/5 group-hover:border-white/10 transition-all">
                    <p className="text-white/80 text-sm leading-relaxed">{c.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
