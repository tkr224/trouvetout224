'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Star, MessageCircle, Send, X, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ReviewSection({ sellerId }: { sellerId: string }) {
  const { user, isAuthenticated } = useAuthStore();
  const [ratings, setRatings] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const isMe = user?.id === sellerId;

  const load = () => {
    api.get(`/ratings/user/${sellerId}`).then(r => { setRatings(r.data.data || []); setAvg(r.data.average || 0); }).catch(() => {});
  };

  useEffect(() => {
    load();
    if (isAuthenticated && !isMe) {
      api.get(`/ratings/can-rate/${sellerId}`).then(r => {
        setCanRate(r.data.canRate);
        setAlreadyRated(r.data.alreadyRated);
        if (r.data.myRating) { setScore(r.data.myRating.score); setComment(r.data.myRating.comment || ''); }
      }).catch(() => {});
    }
  }, [sellerId, isAuthenticated]);

  const submitReview = async () => {
    if (score < 1) { toast.error('Choisissez une note'); return; }
    try {
      await api.post('/ratings', { ratedId: sellerId, score, comment });
      toast.success('Avis publié ! Merci 🙏');
      setShowForm(false); setAlreadyRated(true);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  const submitReply = async (ratingId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.put(`/ratings/${ratingId}/reply`, { reply: replyText });
      toast.success('Réponse publiée !');
      setReplyingTo(null); setReplyText('');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Star size={20} className="text-gold-500 fill-gold-400" />
          Avis ({ratings.length})
        </h2>
        <div className="flex items-center gap-3">
          {avg > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className={i <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
                ))}
              </div>
              <span className="font-bold text-dark-900">{avg.toFixed(1)}</span>
            </div>
          )}
          {canRate && !isMe && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-4">
              {alreadyRated ? 'Modifier mon avis' : 'Laisser un avis'}
            </button>
          )}
        </div>
      </div>

      {isAuthenticated && !canRate && !isMe && (
        <div className="bg-dark-50 rounded-xl p-4 mb-5 text-sm text-dark-500 flex items-center gap-2">
          <MessageCircle size={16} /> Échangez un message avec ce vendeur pour pouvoir laisser un avis.
        </div>
      )}

      {showForm && (
        <div className="bg-primary-50 rounded-2xl p-5 mb-6 border border-primary-100">
          <p className="font-semibold text-dark-800 mb-3">Votre note</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setScore(i)} onMouseEnter={() => setHoverScore(i)} onMouseLeave={() => setHoverScore(0)}>
                <Star size={32} className={i <= (hoverScore || score) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Partagez votre expérience avec ce vendeur..." className="input resize-none mb-3" />
          <div className="flex gap-2">
            <button onClick={submitReview} className="btn-primary text-sm flex items-center gap-2"><Send size={15} /> Publier l'avis</button>
            <button onClick={() => setShowForm(false)} className="btn-outline text-sm">Annuler</button>
          </div>
        </div>
      )}

      {ratings.length === 0 ? (
        <div className="text-center py-10">
          <MessageCircle size={36} className="text-dark-200 mx-auto mb-3" />
          <p className="text-dark-500 text-sm">Aucun avis pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((r: any) => (
            <div key={r.id} className="p-4 bg-dark-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700 shrink-0 overflow-hidden">
                  {r.rater?.avatar
                    ? <img src={r.rater.avatar} alt="" className="w-full h-full object-cover" />
                    : <>{r.rater?.firstName?.[0]}</>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-dark-900 text-sm">{r.rater?.firstName} {r.rater?.lastName}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={11} className={i <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
                      ))}
                    </div>
                    <span className="text-dark-400 text-xs">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: fr })}</span>
                  </div>
                  {r.comment && <p className="text-dark-600 text-sm">{r.comment}</p>}

                  {r.reply && (
                    <div className="mt-3 ml-2 pl-3 border-l-2 border-primary-300 bg-white rounded-r-lg p-3">
                      <p className="text-xs font-semibold text-primary-700 mb-1 flex items-center gap-1">
                        <CornerDownRight size={11} /> Réponse du vendeur
                      </p>
                      <p className="text-dark-600 text-sm">{r.reply}</p>
                    </div>
                  )}

                  {isMe && !r.reply && (
                    replyingTo === r.id ? (
                      <div className="mt-3">
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Votre réponse..." className="input resize-none text-sm mb-2" />
                        <div className="flex gap-2">
                          <button onClick={() => submitReply(r.id)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Send size={12} /> Répondre</button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="btn-outline text-xs py-1.5 px-3"><X size={12} /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingTo(r.id)} className="mt-2 text-primary-700 text-xs font-medium hover:underline flex items-center gap-1">
                        <MessageCircle size={12} /> Répondre
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
