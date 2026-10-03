'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin, ChevronDown, Bell, MessageCircle, User, Plus, LogOut, Shield, Settings, Store, Users, Search,
  Wrench, Calendar, Building2, Car, Hotel, Briefcase, Utensils, Phone, Check, UserPlus, LogIn, Globe, LayoutGrid,
} from 'lucide-react';
import { LogoWordmark } from '@/components/Logo';
import { useAuthStore } from '@/store/auth.store';
import { useVoiceCallStore } from '@/store/voiceCall.store';
import { useUnreadNotifCount } from '@/hooks/useNotifications';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { LANGUAGES } from '@/lib/languages';

const CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Boké', 'Mamou', 'Faranah'];
const SW = 1.75; // épaisseur de trait des icônes (maquette)

// Liens toujours visibles (desktop) — les autres sections sont dans « Plus ».
const NAV_LINK_HREFS = [
  { href: '/annonces/lister', key: 'annonces',  match: '/annonces' },
  { href: '/je-cherche',      key: 'jeCherche', match: '/je-cherche' },
  { href: '/boutiques',       key: 'boutiques', match: '/boutiques' },
] as const;

const MORE_LINK_HREFS = [
  { href: '/emplois',     ns: 'links',     key: 'emplois',     icon: Briefcase },
  { href: '/restaurants', ns: 'links',     key: 'restaurants', icon: Utensils },
  { href: '/hotels',      ns: 'links',     key: 'hotels',      icon: Hotel },
  { href: '/services',    ns: 'moreLinks', key: 'services',    icon: Wrench },
  { href: '/evenements',  ns: 'moreLinks', key: 'evenements',  icon: Calendar },
  { href: '/immobilier',  ns: 'moreLinks', key: 'immobilier',  icon: Building2 },
  { href: '/vehicules',   ns: 'moreLinks', key: 'vehicules',   icon: Car },
] as const;

interface NavbarProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  /** « page » : version compacte (logo + recherche + Publier + avatar), ex. page annonce. */
  variant?: 'default' | 'page';
}

const MENU_ITEM = 'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-tt-sec2 hover:bg-tt-active hover:text-tt-text transition-colors text-left';
const ICON_BTN = 'relative w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-tt-border-strong text-tt-sec2 hover:text-tt-text hover:bg-tt-active transition-colors';

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return ref;
}

/** Avatar rond (40px desktop, 44px mobile) : bordure verte, initiale vert clair. */
function AvatarBubble({ size }: { size: number }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const style = { width: size, height: size };
  if (!loggedIn) {
    return (
      <span style={style} className="rounded-full border-2 border-tt-border-strong bg-tt-card flex items-center justify-center text-tt-sec2">
        <User size={18} strokeWidth={SW} />
      </span>
    );
  }
  return (
    <span style={style} className="rounded-full border-2 border-tt-green bg-tt-green-soft flex items-center justify-center overflow-hidden font-display font-semibold text-[15px] text-tt-green-light">
      {user!.avatar
        ? <img src={cloudinaryThumb(user!.avatar, 96)} alt="" className="w-full h-full object-cover" />
        : (user!.firstName?.[0] || '?').toUpperCase()}
    </span>
  );
}

/** Menu du compte : actions secondaires (appel vocal, langue, paramètres, admin) et, sur mobile, toutes les sections du site. */
function AccountMenu({ size }: { size: number }) {
  const t = useTranslations('nav');
  const tVoice = useTranslations('voiceCall');
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const openVoiceCall = useVoiceCallStore(s => s.open);
  const { locale, switchLocale, isPending } = useLanguageSwitch();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useClickOutside(open, close);

  const isAdmin = loggedIn && ['ADMIN', 'SUPER_ADMIN'].includes(user!.role);
  const isVendor = loggedIn && (user!.accountType === 'VENDEUR' || user!.accountType === 'LES_DEUX');

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('accountMenu')}
        title={loggedIn ? `${user!.firstName} ${user!.lastName}` : t('accountMenu')}
        className="relative rounded-full flex items-center justify-center before:absolute before:-inset-1 before:content-['']"
      >
        <AvatarBubble size={size} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto bg-tt-card rounded-2xl border border-tt-border shadow-2xl py-2 z-50">
          {loggedIn ? (
            <>
              <div className="px-4 pb-2 mb-1 border-b border-tt-border">
                <p className="font-semibold text-tt-text text-sm truncate">{user!.firstName} {user!.lastName}</p>
                {user!.email && <p className="text-tt-muted text-xs truncate">{user!.email}</p>}
              </div>
              <Link href="/profil" onClick={close} className={MENU_ITEM} role="menuitem"><User size={16} strokeWidth={SW} /> {t('myProfile')}</Link>
              {isVendor && <Link href="/vendeur" onClick={close} className={MENU_ITEM} role="menuitem"><Store size={16} strokeWidth={SW} /> {t('sellerSpace')}</Link>}
              <Link href="/abonnements" onClick={close} className={MENU_ITEM} role="menuitem"><Users size={16} strokeWidth={SW} /> {t('mySubscriptions')}</Link>
              {isAdmin && <Link href="/admin" onClick={close} className={MENU_ITEM} role="menuitem"><Shield size={16} strokeWidth={SW} /> {t('adminDashboard')}</Link>}
            </>
          ) : (
            <>
              <Link href="/auth/connexion" onClick={close} className={MENU_ITEM} role="menuitem"><LogIn size={16} strokeWidth={SW} /> {t('login')}</Link>
              <Link href="/auth/inscription" onClick={close} className={MENU_ITEM} role="menuitem"><UserPlus size={16} strokeWidth={SW} /> {t('register')}</Link>
            </>
          )}

          {/* Mobile : toutes les sections du site (la barre du bas ne montre que l'essentiel) */}
          <div className="lg:hidden my-1 border-t border-tt-border pt-1">
            {[...NAV_LINK_HREFS.map(l => ({ href: l.href, label: t(`links.${l.key}`), icon: LayoutGrid })),
              ...MORE_LINK_HREFS.map(l => ({ href: l.href, label: t(`${l.ns}.${l.key}`), icon: l.icon }))].map(l => (
              <Link key={l.href} href={l.href} onClick={close} className={MENU_ITEM} role="menuitem"><l.icon size={16} strokeWidth={SW} /> {l.label}</Link>
            ))}
          </div>

          <div className="my-1 border-t border-tt-border" />
          <button type="button" onClick={() => { close(); openVoiceCall(); }} className={`${MENU_ITEM} !text-tt-link`} role="menuitem">
            <Phone size={16} strokeWidth={SW} /> {tVoice('button')}
          </button>
          <div className="px-4 py-2">
            <p className="text-xs text-tt-muted font-medium flex items-center gap-1.5 mb-1.5"><Globe size={13} strokeWidth={SW} /> {t('changeLanguage')}</p>
            <div className="flex gap-1.5">
              {LANGUAGES.map(l => (
                <button key={l.code} type="button" disabled={isPending} onClick={() => switchLocale(l.code)} aria-pressed={locale === l.code} title={l.label}
                  className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                    locale === l.code ? 'border-tt-green bg-tt-green-soft text-tt-green-light' : 'border-tt-border-strong text-tt-sec hover:text-tt-text'
                  }`}>
                  {l.code.toUpperCase()}{locale === l.code && <Check size={11} />}
                </button>
              ))}
            </div>
          </div>
          <Link href="/parametres" onClick={close} className={MENU_ITEM} role="menuitem"><Settings size={16} strokeWidth={SW} /> {t('settings')}</Link>
          {loggedIn && (
            <>
              <div className="my-1 border-t border-tt-border" />
              <button type="button" onClick={() => { close(); logout(); }} className={`${MENU_ITEM} !text-[#E5484D]`} role="menuitem">
                <LogOut size={16} strokeWidth={SW} /> {t('logout')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NotifButton({ size, iconSize = 18 }: { size: number; iconSize?: number }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const { data: unread = 0 } = useUnreadNotifCount(loggedIn);
  return (
    <Link href="/notifications" aria-label="Notifications" style={{ width: size, height: size }}
      className="relative shrink-0 flex items-center justify-center rounded-xl border border-tt-border-strong text-tt-sec2 hover:text-tt-text hover:bg-tt-active transition-colors">
      <Bell size={iconSize} strokeWidth={SW} />
      {loggedIn && unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-tt-red rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

function PublishButton() {
  const t = useTranslations('nav');
  return (
    <Link href="/annonces/publier"
      className="shrink-0 h-10 px-4 rounded-xl bg-tt-gold text-tt-on-gold font-semibold text-[15px] inline-flex items-center gap-1.5 hover:brightness-95 transition whitespace-nowrap">
      <Plus size={18} strokeWidth={2} /> {t('publish')}
    </Link>
  );
}

function CompactSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={e => { e.preventDefault(); const v = q.trim(); router.push(v ? `/annonces/lister?q=${encodeURIComponent(v)}` : '/annonces/lister'); }}
      className="w-full max-w-[520px] h-[42px] flex items-center gap-2 px-3.5 rounded-xl bg-tt-field border border-tt-border-strong focus-within:border-tt-green"
      role="search"
    >
      <Search size={18} strokeWidth={SW} className="text-tt-muted shrink-0" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="iPhone, Toyota, villa à Kipé…"
        className="flex-1 min-w-0 !bg-transparent !border-0 outline-none text-[15px] text-tt-text placeholder:text-tt-faint" aria-label="Rechercher" />
    </form>
  );
}

export default function Navbar({ selectedCity = 'Conakry', onCityChange, variant = 'default' }: NavbarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname() || '/';
  const [cityOpen, setCityOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const cityRef = useClickOutside(cityOpen, () => setCityOpen(false));
  const moreRef = useClickOutside(moreOpen, () => setMoreOpen(false));
  const NAV_LINKS = NAV_LINK_HREFS.map(l => ({ ...l, label: t(`links.${l.key}`) }));
  const MORE_LINKS = MORE_LINK_HREFS.map(l => ({ ...l, label: t(`${l.ns}.${l.key}`) }));
  const moreActive = MORE_LINKS.some(l => pathname.startsWith(l.href));

  return (
    <header className="tt-nav sticky top-0 z-50 bg-tt-bg">
      {/* ── Desktop (≥ 1024px) ── */}
      <div className="hidden lg:block border-b border-tt-border">
        <div className="tt-container h-[72px] flex items-center gap-3">
          <Link href="/" className="shrink-0" aria-label="TrouveTout224 — accueil"><LogoWordmark /></Link>

          {variant === 'default' ? (
            <>
              {/* Pastille ville */}
              <div className="relative hidden xl:block shrink-0 ml-3" ref={cityRef}>
                <button onClick={() => setCityOpen(v => !v)} aria-expanded={cityOpen}
                  className="h-9 pl-3 pr-2.5 rounded-full border border-tt-border-strong text-tt-sec2 text-sm inline-flex items-center gap-1.5 hover:text-tt-text whitespace-nowrap">
                  <MapPin size={16} strokeWidth={SW} /> {selectedCity}
                  <ChevronDown size={14} strokeWidth={SW} className={`transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
                </button>
                {cityOpen && (
                  <div className="absolute top-full mt-2 left-0 bg-tt-card rounded-xl border border-tt-border shadow-2xl py-1 min-w-[180px] z-50">
                    {CITIES.map(city => (
                      <button key={city} onClick={() => { onCityChange?.(city); setCityOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-tt-active ${city === selectedCity ? 'text-tt-text font-medium' : 'text-tt-sec'}`}>
                        <MapPin size={14} strokeWidth={SW} className="text-tt-green-icon" /> {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Liens, poussés à droite */}
              <nav className="ml-auto flex items-center gap-1" aria-label="Navigation principale">
                {NAV_LINKS.map(link => {
                  const active = pathname.startsWith(link.match);
                  return (
                    <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                      className={`px-3.5 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap transition-colors ${active ? 'text-tt-text bg-tt-active' : 'text-tt-sec hover:text-tt-text'}`}>
                      {link.label}
                    </Link>
                  );
                })}
                <div className="relative" ref={moreRef}>
                  <button onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}
                    className={`px-3.5 py-2 rounded-[10px] text-[15px] font-medium whitespace-nowrap inline-flex items-center gap-1 transition-colors ${moreActive ? 'text-tt-text bg-tt-active' : 'text-tt-sec hover:text-tt-text'}`}>
                    {t('more')} <ChevronDown size={15} strokeWidth={SW} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-tt-card rounded-xl border border-tt-border shadow-2xl py-1.5 min-w-[200px] z-50">
                      {MORE_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-tt-sec2 hover:bg-tt-active hover:text-tt-text whitespace-nowrap">
                          <Icon size={16} strokeWidth={SW} className="text-tt-green-icon" /> {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div className="flex items-center gap-2 ml-2">
                <PublishButton />
                <Link href="/messages" className={ICON_BTN} aria-label={t('messaging')} title={t('messaging')}>
                  <MessageCircle size={18} strokeWidth={SW} />
                </Link>
                <NotifButton size={40} />
                <AccountMenu size={40} />
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 flex justify-center px-4"><CompactSearch /></div>
              <div className="flex items-center gap-2">
                <PublishButton />
                <AccountMenu size={40} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile / tablette (< 1024px) ── */}
      <div className="lg:hidden border-b border-tt-border">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <Link href="/" aria-label="TrouveTout224 — accueil" className="min-w-0"><LogoWordmark iconSize={26} textClass="text-[18px]" /></Link>
          <div className="flex items-center gap-2 shrink-0">
            <NotifButton size={44} iconSize={20} />
            <AccountMenu size={44} />
          </div>
        </div>
      </div>

      <div className="tt-tricolor" aria-hidden="true"><span /><span /><span /></div>
    </header>
  );
}
