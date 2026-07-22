'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Loader2, Mail, ArrowLeft, CheckCircle, MessageCircle, ShoppingBag, Lock, Zap,
  HelpCircle, KeyRound, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

type Mode = 'email' | 'questions';
type SecurityQuestion = { id: string; label: string };

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tq = useTranslations('security');
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('email');

  // ── Flux "par email" (inchangé) ─────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t('genericErrorEmail'));
    } finally {
      setLoading(false);
    }
  };

  // ── Flux "par questions de sécurité" ────────────────────────────
  const [qIdentifier, setQIdentifier] = useState('');
  const [qStep, setQStep] = useState<'identifier' | 'answer'>('identifier');
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState('');
  const [qToken, setQToken] = useState('');
  const [qQuestions, setQQuestions] = useState<SecurityQuestion[]>([]);
  const [qAnswers, setQAnswers] = useState<Record<string, string>>({});

  const startQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qIdentifier.trim()) return;
    setQLoading(true);
    setQError('');
    try {
      const { data } = await api.post('/auth/forgot-password/security-questions', { identifier: qIdentifier.trim() });
      setQToken(data.token);
      setQQuestions(data.questions || []);
      setQAnswers({});
      setQStep('answer');
    } catch (err: any) {
      setQError(err.response?.data?.error || t('genericErrorRetry'));
    } finally {
      setQLoading(false);
    }
  };

  const submitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setQLoading(true);
    setQError('');
    try {
      const answers = qQuestions.map(q => ({ questionId: q.id, answer: qAnswers[q.id] || '' }));
      const { data } = await api.post('/auth/forgot-password/verify-security-questions', { token: qToken, answers });
      router.push(`/auth/reset-password?token=${data.resetToken}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || t('genericErrorRetry');
      setQError(msg);
      if (msg.toLowerCase().includes('session expirée')) {
        setQStep('identifier');
      }
    } finally {
      setQLoading(false);
    }
  };

  const fieldCls =
    'w-full border border-dark-200 rounded-2xl px-4 py-3.5 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200';

  return (
    <div className="min-h-screen flex bg-dark-50">

      {/* Panneau gauche décoratif — desktop uniquement */}
      <aside className="hidden lg:flex w-[460px] flex-shrink-0 sticky top-0 h-screen flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-guinea-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-primary-500/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <Link href="/" className="inline-block">
            <Logo size={90} />
          </Link>
          <h1 className="font-display font-bold text-[2.4rem] leading-tight text-white mt-7 mb-2">
            Trouve<span className="text-gold-400">Tout</span><span className="text-guinea-300">224</span>
          </h1>
          <p className="text-primary-100 text-base mb-12">
            {t('heroSubtitle')}
          </p>
          <div className="space-y-3 text-left">
            {[
              { Icon: ShoppingBag, text: t('heroFeature1'),  cls: 'text-gold-300' },
              { Icon: Lock,        text: t('heroFeature2'),  cls: 'text-primary-300' },
              { Icon: Zap,         text: t('heroFeature3'),  cls: 'text-guinea-300' },
            ].map(({ Icon, text, cls }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5">
                <Icon size={20} className={cls} />
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <div className="w-6 h-3.5 rounded-sm bg-guinea-500" />
            <div className="w-6 h-3.5 rounded-sm bg-gold-400" />
            <div className="w-6 h-3.5 rounded-sm bg-primary-500" />
          </div>
        </div>
      </aside>

      {/* Panneau droit : formulaire */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/"><Logo size={58} /></Link>
          </div>

          <div className="bg-white rounded-3xl shadow-card border border-dark-100 p-5 sm:p-8">

            {!sent && qStep !== 'answer' && (
              <div className="mb-7">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                  {mode === 'email' ? <Mail size={26} className="text-primary-700" /> : <HelpCircle size={26} className="text-primary-700" />}
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-dark-900">{t('pageTitle')}</h2>
                <p className="text-dark-500 mt-1.5 text-sm">
                  {t('pageSubtitle')}
                </p>
              </div>
            )}

            {/* Sélecteur de méthode — masqué une fois une demande envoyée / en cours de vérification */}
            {!sent && qStep !== 'answer' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-dark-50 rounded-2xl mb-6">
                <button
                  onClick={() => { setMode('email'); setQError(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === 'email' ? 'bg-white text-primary-700 shadow-sm' : 'text-dark-500'
                  }`}>
                  <Mail size={14} /> {t('methodEmail')}
                </button>
                <button
                  onClick={() => { setMode('questions'); setError(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === 'questions' ? 'bg-white text-primary-700 shadow-sm' : 'text-dark-500'
                  }`}>
                  <HelpCircle size={14} /> {t('methodQuestions')}
                </button>
              </div>
            )}

            {/* ═══════════════════════ MODE EMAIL ═══════════════════════ */}
            {mode === 'email' && (
              !sent ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        {t('identifierLabel')}
                      </label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder={t('identifierPlaceholder')}
                        className={fieldCls}
                        required
                      />
                      <p className="text-xs text-dark-400 mt-2">{t('emailHint')}</p>
                    </div>

                    {error && (
                      <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
                    >
                      {loading
                        ? <><Loader2 size={18} className="animate-spin" /> {t('sending')}</>
                        : t('sendLink')}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/auth/connexion"
                      className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
                    >
                      <ArrowLeft size={14} /> {t('backToLogin')}
                    </Link>
                  </div>
                </>
              ) : (
                /* État succès */
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-primary-600" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">{t('sentTitle')}</h2>
                  <p className="text-dark-500 text-sm mb-6 leading-relaxed">
                    {t('sentMessage')}
                  </p>

                  <div className="bg-primary-50 rounded-2xl p-5 mb-6 text-left">
                    <p className="text-sm font-semibold text-dark-700 mb-2">{t('nothingReceivedTitle')}</p>
                    <p className="text-sm text-dark-500 mb-3">
                      {t('nothingReceivedMessage')}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { setSent(false); setMode('questions'); }}
                        className="inline-flex items-center justify-center gap-2 border-2 border-primary-700 text-primary-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm hover:bg-primary-50"
                      >
                        <HelpCircle size={15} /> {t('trySecurityQuestions')}
                      </button>
                      <a
                        href="https://wa.me/224627543486"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <MessageCircle size={15} /> {t('contactSupport')}
                      </a>
                    </div>
                  </div>

                  <Link
                    href="/auth/connexion"
                    className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline"
                  >
                    <ArrowLeft size={14} /> {t('backToLogin')}
                  </Link>
                </div>
              )
            )}

            {/* ═══════════════════ MODE QUESTIONS DE SÉCURITÉ ═══════════════════ */}
            {mode === 'questions' && qStep === 'identifier' && (
              <>
                <form onSubmit={startQuestions} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      {t('identifierLabel')}
                    </label>
                    <input
                      type="text"
                      value={qIdentifier}
                      onChange={e => setQIdentifier(e.target.value)}
                      placeholder={t('identifierPlaceholder')}
                      className={fieldCls}
                      required
                    />
                    <p className="text-xs text-dark-400 mt-2">
                      {t('questionsHint')}
                    </p>
                  </div>

                  {qError && (
                    <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{qError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={qLoading}
                    className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
                  >
                    {qLoading
                      ? <><Loader2 size={18} className="animate-spin" /> {t('verifying')}</>
                      : t('continueBtn')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/connexion"
                    className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
                  >
                    <ArrowLeft size={14} /> {t('backToLogin')}
                  </Link>
                </div>
              </>
            )}

            {mode === 'questions' && qStep === 'answer' && (
              <>
                <button
                  onClick={() => { setQStep('identifier'); setQError(''); }}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-dark-700 text-sm font-medium mb-5 transition-colors"
                >
                  <ArrowLeft size={15} /> {t('backBtn')}
                </button>

                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                  <KeyRound size={26} className="text-primary-700" />
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-dark-900 mb-1.5">{t('answerTitle')}</h2>
                <p className="text-dark-500 text-sm mb-6">
                  {t('answerSubtitle')}
                </p>

                <form onSubmit={submitAnswers} className="space-y-5">
                  {qQuestions.map(q => (
                    <div key={q.id}>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">{tq(`questions.${q.id}`)}</label>
                      <input
                        type="text"
                        value={qAnswers[q.id] || ''}
                        onChange={e => setQAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        placeholder={t('answerPlaceholder')}
                        className={fieldCls}
                        required
                      />
                    </div>
                  ))}

                  {qError && (
                    <div className="flex items-start gap-2 text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{qError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={qLoading}
                    className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
                  >
                    {qLoading
                      ? <><Loader2 size={18} className="animate-spin" /> {t('verifying')}</>
                      : t('verifyAnswers')}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
