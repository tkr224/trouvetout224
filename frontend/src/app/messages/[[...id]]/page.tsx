'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, MessageCircle, ArrowLeft, MoreVertical, User, Ban, Flag, Trash2, X, Check, CheckCheck, Reply, Camera, AlertTriangle, Mail, AlertOctagon, HelpCircle, ShoppingBag, ShieldAlert, ChevronDown } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Navbar from '@/components/layout/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import toast from 'react-hot-toast';

let socket: Socket;

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [msgMenu, setMsgMenu] = useState<string | null>(null);
  const [showSafetyTip, setShowSafetyTip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', { auth: { token: accessToken } });

    socket.on('new_message', (msg: any) => {
      setMessages((prev) => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      if (msg.senderId !== user?.id && msg.conversationId === conversationId) {
        socket.emit('mark_read', { conversationId });
      }
    });

    socket.on('messages_read', ({ readBy }: any) => {
      if (readBy !== user?.id) {
        setMessages((prev) => prev.map(m => m.senderId === user?.id ? { ...m, isRead: true } : m));
      }
    });

    socket.on('message_deleted', ({ messageId }: any) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, deletedForAll: true, content: null, imageUrl: null } : m));
    });

    socket.on('user_typing', ({ conversationId: cid }: any) => { if (cid === conversationId) setTyping(true); });
    socket.on('user_stop_typing', ({ conversationId: cid }: any) => { if (cid === conversationId) setTyping(false); });

    socket.on('online_users', ({ userIds }: any) => setOnlineUsers(userIds));
    socket.on('user_online', ({ userId: uid }: any) => setOnlineUsers((prev) => [...new Set([...prev, uid])]));
    socket.on('user_offline', ({ userId: uid }: any) => setOnlineUsers((prev) => prev.filter(id => id !== uid)));

    return () => { socket?.disconnect(); };
  }, [accessToken, conversationId, user?.id]);

  useEffect(() => {
    api.get('/messages/conversations').then((res) => setConversations(res.data.data || [])).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    socket?.emit('join_conversation', conversationId);
    api.get(`/messages/conversations/${conversationId}/messages`).then((res) => {
      setMessages(res.data.data || []);
      socket?.emit('mark_read', { conversationId });
    }).catch(() => {});
  }, [conversationId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;
    const content = input.trim();
    const pendingReplyTo = replyTo;
    setInput('');
    setReplyTo(null);
    socket?.emit('stop_typing', { conversationId });
    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, { content, replyToId: pendingReplyTo?.id });
      setMessages((prev) => prev.find(m => m.id === res.data.data.id) ? prev : [...prev, res.data.data]);
    } catch (err: any) {
      // On restaure le texte tapé et la citation pour ne rien perdre, et on prévient clairement
      setInput(content);
      setReplyTo(pendingReplyTo);
      toast.error(err.response?.data?.error || 'Message non envoyé. Vérifiez votre connexion et réessayez.');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit('typing', { conversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('stop_typing', { conversationId }), 1500);
  };

  const deleteMessage = async (msgId: string, mode: 'me' | 'all') => {
    setMsgMenu(null);
    try {
      await api.delete(`/messages/msg/${msgId}?mode=${mode}`);
      if (mode === 'me') {
        setMessages((prev) => prev.filter(m => m.id !== msgId));
      } else {
        setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, deletedForAll: true, content: null } : m));
      }
      toast.success('Message supprimé');
    } catch { toast.error('Erreur'); }
  };

  const activeConv = conversations.find((c) => c.id === conversationId);
  const otherUser = activeConv?.participants?.find((p: any) => p.id !== user?.id);
  const isOtherOnline = otherUser && onlineUsers.includes(otherUser.id);

  const handleBlock = async () => {
    if (!otherUser) return;
    if (!confirm(`Bloquer ${otherUser.firstName} ?`)) return;
    try {
      await api.post('/messages/block', { blockedId: otherUser.id });
      toast.success('Utilisateur bloqué'); setShowMenu(false);
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette conversation ?')) return;
    try {
      await api.delete(`/messages/conversations/${conversationId}`);
      toast.success('Conversation supprimée');
      setConversations(c => c.filter(x => x.id !== conversationId));
      router.push('/messages');
    } catch { toast.error('Erreur'); }
  };

  const submitReport = async () => {
    if (!reportReason) { toast.error('Choisissez une raison'); return; }
    try {
      await api.post('/reports', { reason: reportReason, reportedUserId: otherUser?.id });
      toast.success('Signalement envoyé. Merci !');
      setShowReport(false); setReportReason(''); setShowMenu(false);
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Liste conversations */}
            <div className={`w-80 border-r border-dark-100 flex flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-dark-100"><h2 className="font-display font-bold text-dark-900">Messages</h2></div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center"><MessageCircle size={40} className="text-dark-300 mx-auto mb-3" /><p className="text-dark-500 text-sm">Aucun message</p></div>
                ) : conversations.map((conv) => {
                  const other = conv.participants?.find((p: any) => p.id !== user?.id);
                  const fullName = other ? `${other.firstName} ${other.lastName}` : 'Utilisateur';
                  const convOnline = other && onlineUsers.includes(other.id);
                  return (
                    <Link key={conv.id} href={`/messages/${conv.id}`} className={`flex items-center gap-3 p-4 hover:bg-dark-50 transition-colors border-b border-dark-50 ${conv.id === conversationId ? 'bg-primary-50' : ''}`}>
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                          {other?.avatar ? <img src={other.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-primary-700 font-bold text-sm">{other?.firstName?.[0]}{other?.lastName?.[0]}</span>}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${convOnline ? 'bg-green-500' : 'bg-guinea-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-dark-900 text-sm truncate">{fullName}</p>
                        <p className="text-dark-400 text-xs truncate">{conv.lastMessage || 'Démarrer la conversation'}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-guinea-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">{conv.unreadCount}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Conversation active */}
            <div className="flex-1 flex flex-col">
              {conversationId ? (
                <>
                  <div className="p-4 border-b border-dark-100 flex items-center gap-3 relative">
                    <Link href="/messages" className="md:hidden"><ArrowLeft size={20} /></Link>
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                        {otherUser?.avatar ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-primary-700 font-bold text-sm">{otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}</span>}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOtherOnline ? 'bg-green-500' : 'bg-guinea-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-dark-900">{otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Utilisateur'}</p>
                      {typing ? (
                        <p className="text-xs text-primary-600 animate-pulse">En train d'écrire...</p>
                      ) : (
                        <p className={`text-xs flex items-center gap-1 ${isOtherOnline ? 'text-green-600' : 'text-dark-400'}`}>
                          <span className={`inline-block w-2 h-2 rounded-full ${isOtherOnline ? 'bg-green-500' : 'bg-dark-300'}`} />
                          {isOtherOnline ? 'En ligne' : 'Hors ligne'}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl hover:bg-dark-100 transition-colors"><MoreVertical size={20} className="text-dark-600" /></button>
                    {showMenu && (
                      <div className="absolute top-16 right-4 bg-white rounded-2xl shadow-card-hover border border-dark-100 py-2 w-56 z-50">
                        <Link href={`/profil/${otherUser?.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors"><User size={16} /> Voir le profil</Link>
                        <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors"><Flag size={16} /> Signaler</button>
                        <button onClick={handleBlock} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"><Ban size={16} /> Bloquer</button>
                        <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-guinea-500 hover:bg-guinea-50 transition-colors"><Trash2 size={16} /> Supprimer la conversation</button>
                      </div>
                    )}
                  </div>

                  {/* Carte annonce liée à la conversation */}
                  {activeConv?.annonce && (
                    <Link
                      href={`/annonces/${activeConv.annonce.slug || activeConv.annonce.id}`}
                      className="mx-4 mt-3 mb-1 flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3 hover:bg-primary-100 hover:border-primary-300 transition-colors group"
                    >
                      {activeConv.annonce.images?.[0]?.url ? (
                        <img src={activeConv.annonce.images[0].url} alt={activeConv.annonce.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                          <ShoppingBag size={18} className="text-primary-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-primary-700 truncate">{activeConv.annonce.title}</p>
                        {activeConv.annonce.price != null && (
                          <p className="text-xs text-primary-600 font-semibold mt-0.5">
                            {activeConv.annonce.price.toLocaleString('fr-GN')} GNF
                          </p>
                        )}
                      </div>
                      <span className="text-primary-400 group-hover:text-primary-600 text-xs font-medium shrink-0">Voir →</span>
                    </Link>
                  )}

                  {/* Bannière anti-arnaque */}
                  {showSafetyTip && (
                    <div className="mx-4 mt-2 mb-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                          <span className="text-xs font-bold text-amber-800">Conseils anti-arnaque</span>
                        </div>
                        <button onClick={() => setShowSafetyTip(false)} className="text-amber-400 hover:text-amber-600 transition-colors p-0.5">
                          <X size={13} />
                        </button>
                      </div>
                      <ul className="text-[11px] text-amber-800 space-y-1">
                        <li className="flex items-start gap-1.5"><span className="font-bold text-amber-500 shrink-0">!</span> Ne payez jamais d&apos;avance sans avoir vu le produit en personne.</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-amber-500 shrink-0">!</span> Rencontrez le vendeur dans un lieu public et fréquenté.</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-amber-500 shrink-0">!</span> N&apos;envoyez pas d&apos;argent par transfert à un inconnu.</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-amber-500 shrink-0">!</span> Vérifiez bien le produit avant de payer.</li>
                      </ul>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-2" onClick={() => { setShowMenu(false); setMsgMenu(null); }}>
                    {messages.length === 0 ? (
                      <div className="text-center py-10"><MessageCircle size={40} className="text-dark-200 mx-auto mb-2" /><p className="text-dark-400 text-sm">Démarrez la conversation !</p></div>
                    ) : messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                          <div className="relative max-w-xs lg:max-w-md">
                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-700 text-white rounded-br-sm' : 'bg-dark-100 text-dark-900 rounded-bl-sm'} ${msg.deletedForAll ? 'italic opacity-60' : ''}`}>
                              {/* Citation du message auquel on répond */}
                              {msg.replyTo && !msg.deletedForAll && (
                                <div className={`text-xs mb-1.5 px-2 py-1 rounded-lg border-l-2 ${isMe ? 'bg-primary-800/40 border-gold-300' : 'bg-dark-200/60 border-primary-500'}`}>
                                  <p className="font-semibold">{msg.replyTo.sender?.firstName}</p>
                                  <p className="truncate opacity-80">{msg.replyTo.content || '[Image]'}</p>
                                </div>
                              )}
                              {msg.deletedForAll ? (
                                <p className="flex items-center gap-1"><Ban size={13} /> Ce message a été supprimé</p>
                              ) : (
                                <>
                                  {msg.imageUrl && <img src={msg.imageUrl} alt="" className="rounded-xl mb-2 max-w-full" />}
                                  {msg.content && <p>{msg.content}</p>}
                                </>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end text-primary-200' : 'text-dark-400'}`}>
                                <span className="text-xs">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}</span>
                                {isMe && !msg.deletedForAll && (msg.isRead ? <CheckCheck size={14} className="text-blue-300" /> : <Check size={14} />)}
                              </div>
                            </div>

                            {/* Bouton menu du message (reply + suppr) */}
                            {!msg.deletedForAll && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setMsgMenu(msgMenu === msg.id ? null : msg.id); }}
                                className={`absolute top-0 ${isMe ? '-left-7' : '-right-7'} opacity-0 group-hover:opacity-100 transition-opacity p-1 text-dark-400 hover:text-dark-700`}
                              >
                                <MoreVertical size={16} />
                              </button>
                            )}

                            {msgMenu === msg.id && (
                              <div className={`absolute top-6 ${isMe ? 'left-0' : 'right-0'} bg-white rounded-xl shadow-card-hover border border-dark-100 py-1.5 w-48 z-50`}>
                                <button onClick={() => { setReplyTo(msg); setMsgMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-700 hover:bg-dark-50"><Reply size={14} /> Répondre</button>
                                <button onClick={() => deleteMessage(msg.id, 'me')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-700 hover:bg-dark-50"><Trash2 size={14} /> Supprimer pour moi</button>
                                {isMe && <button onClick={() => deleteMessage(msg.id, 'all')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-guinea-500 hover:bg-guinea-50"><Trash2 size={14} /> Supprimer pour tous</button>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {typing && (
                      <div className="flex justify-start">
                        <div className="bg-dark-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Barre de réponse */}
                  {replyTo && (
                    <div className="px-4 py-2 border-t border-dark-100 bg-dark-50 flex items-center gap-3">
                      <div className="flex-1 border-l-2 border-primary-500 pl-3">
                        <p className="text-xs font-semibold text-primary-700">Répondre à {replyTo.sender?.firstName}</p>
                        <p className="text-xs text-dark-500 truncate">{replyTo.content || '[Image]'}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="text-dark-400 hover:text-dark-700"><X size={18} /></button>
                    </div>
                  )}

                  <div className="p-4 border-t border-dark-100">
                    <div className="flex items-center gap-2">
                      <input value={input} onChange={handleTyping} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Écrivez un message..." className="flex-1 bg-dark-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                      <button onClick={sendMessage} disabled={!input.trim()} className="p-2.5 bg-primary-700 text-white rounded-xl disabled:opacity-40 hover:bg-primary-800 transition-colors"><Send size={18} /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center"><MessageCircle size={60} className="text-dark-200 mx-auto mb-4" /><p className="text-dark-500 font-medium">Sélectionnez une conversation</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-dark-900 text-lg">Signaler l'utilisateur</h3>
              <button onClick={() => setShowReport(false)} className="text-dark-400 hover:text-dark-700"><X size={20} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { v: 'SCAM',                 l: 'Arnaque',               Icon: AlertTriangle },
                { v: 'SPAM',                 l: 'Spam / Harcèlement',    Icon: Mail },
                { v: 'INAPPROPRIATE_CONTENT',l: 'Contenu inapproprié',   Icon: AlertOctagon },
                { v: 'OTHER',                l: 'Autre',                  Icon: HelpCircle },
              ].map(r => (
                <label key={r.v} className="flex items-center gap-3 p-3 rounded-xl border border-dark-200 hover:border-guinea-400 cursor-pointer has-[:checked]:border-guinea-500 has-[:checked]:bg-guinea-50 transition-colors">
                  <input type="radio" name="reason" value={r.v} onChange={e => setReportReason(e.target.value)} className="accent-guinea-500" />
                  <r.Icon size={15} className="text-dark-500 shrink-0" />
                  <span className="text-sm font-medium text-dark-700">{r.l}</span>
                </label>
              ))}
            </div>
            <button onClick={submitReport} className="w-full bg-guinea-500 text-white font-semibold py-3 rounded-xl hover:bg-guinea-600 transition-colors">Envoyer le signalement</button>
          </div>
        </div>
      )}
    </div>
  );
}