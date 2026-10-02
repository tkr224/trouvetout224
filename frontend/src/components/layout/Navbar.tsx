'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin, ChevronDown, Bell, MessageCircle, User, Plus, Menu, X, LogOut, Shield, Settings, Store, Users,
  Wrench, Calendar, Building2, Car, Hotel, Briefcase, Utensils, Phone, Check, UserPlus, LogIn, Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useVoiceCallStore } from '@/store/voiceCall.store';
import { useUnreadNotifCount } from '@/hooks/useNotifications';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { LANGUAGES } from '@/lib/languages';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const NAV_LINK_HREFS = [
  { href: '/annonces/lister', key: 'annonces',    icon: null,      color: '' },
  { href: '/je-cherche',      key: 'jeCherche',   icon: null,      color: '' },
  { href: '/boutiques',       key: 'boutiques',   icon: null,      color: '' },
  { href: '/emplois',         key: 'emplois',     icon: Briefcase, color: 'text-indigo-600' },
  { href: '/restaurants',     key: 'restaurants', icon: Utensils,  color: 'text-orange-600' },
  { href: '/hotels',          key: 'hotels',      icon: Hotel,     color: 'text-rose-600' },
] as const;

// Liens qui passent dans « Plus » quand la place manque, dans cet ordre (le premier
// part en premier). Annonces, Je cherche et Boutiques restent toujours visibles.
const COLLAPSE_ORDER = ['/hotels', '/restaurants', '/emplois'];
// En dessous de cette largeur d'écran (2xl), ils sont TOUJOURS dans « Plus » ;
// au-dessus, la mesure ci-dessous les y range quand même s'ils ne tiennent pas.
const ALL_LINKS_MIN_WIDTH = 1536;
const LINK_GAP_PX = 4; // gap-1 entre les liens

interface NavbarProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

const MORE_LINK_HREFS = [
  { href: '/services',   key: 'services',   icon: Wrench,    color: 'text-teal-600' },
  { href: '/evenements', key: 'evenements', icon: Calendar,  color: 'text-purple-600' },
  { href: '/immobilier', key: 'immobilier', icon: Building2, color: 'text-amber-600' },
  { href: '/vehicules',  key: 'vehicules',  icon: Car,       color: 'text-sky-600' },
] as const;

const LINK_BASE = 'nav-link py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0';
const LINK_CLASS = `${LINK_BASE} px-3`;
const LINK_COMPACT = `${LINK_BASE} px-2`;
const MENU_ITEM = 'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 hover:text-dark-900 transition-colors text-left';
// Bouton icône : 36px visibles, zone tactile 44px via un pseudo-élément invisible
const ICON_BTN = "nav-icon-btn relative w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors before:absolute before:-inset-1 before:content-['']";

/** Menu du compte (avatar) : regroupe les actions secondaires pour alléger la barre
 *  — appel vocal, langue, paramètres, admin, et les liens de compte. */
function AccountMenu() {
  const t = useTranslations('nav');
  const tVoice = useTranslations('voiceCall');
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const openVoiceCall = useVoiceCallStore(s => s.open);
  const { locale, switchLocale, isPending } = useLanguageSwitch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const isAdmin = loggedIn && ['ADMIN', 'SUPER_ADMIN'].includes(user!.role);
  const isVendor = loggedIn && (user!.accountType === 'VENDEUR' || user!.accountType === 'LES_DEUX');
  const close = () => setOpen(false);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('accountMenu')}
        title={loggedIn ? `${user!.firstName} ${user!.lastName}` : t('accountMenu')}
        className={loggedIn
          ? "nav-avatar relative w-9 h-9 flex items-center justify-center rounded-xl bg-primary-700 text-white font-bold text-xs before:absolute before:-inset-1 before:content-['']"
          : ICON_BTN}
      >
        {loggedIn
          ? (user!.avatar
              ? <img src={cloudinaryThumb(user!.avatar, 80)} alt="" className="w-9 h-9 object-cover rounded-xl" />
              : `${user!.firstName[0]}${user!.lastName[0]}`)
          : <User size={18} />}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-dark-100 shadow-card-hover py-2 z-50">
          {loggedIn ? (
            <>
              <div className="px-4 pb-2 mb-1 border-b border-dark-100">
                <p className="font-semibold text-dark-900 text-sm truncate">{user!.firstName} {user!.lastName}</p>
                {user!.email && <p className="text-dark-400 text-xs truncate">{user!.email}</p>}
              </div>
              <Link href="/profil" onClick={close} className={MENU_ITEM} role="menuitem"><User size={15} /> {t('myProfile')}</Link>
              {isVendor && <Link href="/vendeur" onClick={close} className={MENU_ITEM} role="menuitem"><Store size={15} className="text-primary-700" /> {t('sellerSpace')}</Link>}
              <Link href="/abonnements" onClick={close} className={MENU_ITEM} role="menuitem"><Users size={15} /> {t('mySubscriptions')}</Link>
              {isAdmin && <Link href="/admin" onClick={close} className={MENU_ITEM} role="menuitem"><Shield size={15} className="text-primary-700" /> {t('adminDashboard')}</Link>}
            </>
          ) : (
            <>
              <Link href="/auth/connexion" onClick={close} className={MENU_ITEM} role="menuitem"><LogIn size={15} /> {t('login')}</Link>
              <Link href="/auth/inscription" onClick={close} className={MENU_ITEM} role="menuitem"><UserPlus size={15} className="text-primary-700" /> {t('register')}</Link>
            </>
          )}

          <div className="my-1 border-t border-dark-100" />
          <button type="button" onClick={() => { close(); openVoiceCall(); }} className={`${MENU_ITEM} !text-primary-700 font-semibold`} role="menuitem">
            <Phone size={15} /> {tVoice('button')}
          </button>
          <div className="px-4 py-2">
            <p className="text-xs text-dark-500 font-medium flex items-center gap-1.5 mb-1.5"><Globe size={13} /> {t('changeLanguage')}</p>
            <div className="flex gap-1.5">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  type="button"
                  disabled={isPending}
                  onClick={() => switchLocale(l.code)}
                  aria-pressed={locale === l.code}
                  title={l.label}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                    locale === l.code ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-primary-400'
                  }`}
                >
                  {l.code.toUpperCase()}
                  {locale === l.code && <Check size={11} />}
                </button>
              ))}
            </div>
          </div>
          <Link href="/parametres" onClick={close} className={MENU_ITEM} role="menuitem"><Settings size={15} /> {t('settings')}</Link>

          {loggedIn && (
            <>
              <div className="my-1 border-t border-dark-100" />
              <button type="button" onClick={() => { close(); logout(); }} className={`${MENU_ITEM} !text-guinea-600`} role="menuitem">
                <LogOut size={15} /> {t('logout')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ selectedCity = 'Conakry', onCityChange }: NavbarProps) {
  const t = useTranslations('nav');
  const NAV_LINKS = NAV_LINK_HREFS.map((l) => ({ ...l, label: t(`links.${l.key}`) }));
  const MORE_LINKS = MORE_LINK_HREFS.map((l) => ({ ...l, label: t(`moreLinks.${l.key}`) }));
  const [cityOpen, setCityOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const openVoiceCall = useVoiceCallStore(s => s.open);
  const tVoice = useTranslations('voiceCall');
  const { data: unreadNotifs = 0 } = useUnreadNotifCount(loggedIn);

  // ── Liens « priority+ » : on mesure la place réellement disponible et on fait
  // passer dans « Plus » les liens qui ne tiennent pas (Hôtels, puis Restaurants,
  // puis Emplois). Fonctionne quelle que soit la langue ou la taille de texte.
  // Avant la 1re mesure, on part du cas le plus compact pour ne jamais déborder.
  const linksBoxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);
  const brandWidth = useRef(0);
  const [collapsed, setCollapsed] = useState<string[]>(COLLAPSE_ORDER);
  // Derniers recours quand même Annonces / Je cherche / Boutiques ne tiennent pas
  // (ex : « Grand texte » sur un écran de 1024 px) : liens plus serrés, puis
  // masquage du nom « TrouveTout224 » (le logo reste).
  const [compact, setCompact] = useState(false);
  const [hideBrand, setHideBrand] = useState(false);
  const hideBrandRef = useRef(false);

  const computeCollapsed = useCallback(() => {
    const box = linksBoxRef.current;
    const m = measureRef.current;
    if (!box || !m || box.clientWidth === 0) return;
    if (brandRef.current && brandRef.current.offsetWidth > 0) brandWidth.current = brandRef.current.offsetWidth;
    // Place disponible « comme si le nom était affiché » → pas d'oscillation
    const available = box.clientWidth - (hideBrandRef.current ? brandWidth.current + 8 : 0);
    const plan = (variant: 'n' | 'c') => {
      const widths = new Map<string, number>();
      m.querySelectorAll<HTMLElement>(`[data-v="${variant}"][data-href]`).forEach(el => widths.set(el.dataset.href!, el.offsetWidth));
      const plusW = m.querySelector<HTMLElement>(`[data-v="${variant}"][data-plus]`)?.offsetWidth ?? 0;
      const need = (hrefs: string[]) => hrefs.reduce((sum, h) => sum + (widths.get(h) ?? 0) + LINK_GAP_PX, 0) + plusW;
      let shown: string[] = NAV_LINK_HREFS.map(l => l.href);
      const hide: string[] = [];
      for (const h of COLLAPSE_ORDER) {
        if (need(shown) <= available) break;
        shown = shown.filter(x => x !== h);
        hide.push(h);
      }
      return { hide, fits: need(shown) <= available };
    };
    const normal = plan('n');
    if (window.innerWidth < ALL_LINKS_MIN_WIDTH) normal.hide = COLLAPSE_ORDER;
    const next = normal.fits ? { ...normal, compact: false, hideBrand: false }
      : { hide: COLLAPSE_ORDER, compact: true, hideBrand: !plan('c').fits };
    setCollapsed(prev => (prev.length === next.hide.length && prev.every((h, i) => h === next.hide[i]) ? prev : next.hide));
    setCompact(next.compact);
    hideBrandRef.current = next.hideBrand;
    setHideBrand(next.hideBrand);
  }, []);

  useEffect(() => {
    computeCollapsed();
    const ro = new ResizeObserver(() => computeCollapsed());
    window.addEventListener('resize', computeCollapsed);
    if (linksBoxRef.current) ro.observe(linksBoxRef.current);
    if (measureRef.current) ro.observe(measureRef.current); // langue / taille de texte
    return () => { ro.disconnect(); window.removeEventListener('resize', computeCollapsed); };
  }, [computeCollapsed]);

  const linkClass = compact ? LINK_COMPACT : LINK_CLASS;
  const visibleLinks = NAV_LINKS.filter(l => !collapsed.includes(l.href));
  const overflowLinks = NAV_LINKS.filter(l => collapsed.includes(l.href));

  const handleCitySelect = (city: string) => {
    onCityChange?.(city);
    setCityOpen(false);
  };

  return (
    <nav className="site-navbar bg-white border-b border-dark-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size={36} />
            <span ref={brandRef} className={`font-display font-bold text-lg leading-none hidden sm:block ${hideBrand ? 'lg:hidden' : ''}`}>
              <span className="text-guinea-500">Trouve</span>
              <span className="text-gold-500">Tout</span>
              <span className="nav-brand-224 text-primary-700">224</span>
            </span>
          </Link>

          {/* Sélecteur de ville */}
          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="nav-city-btn flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-200 text-dark-600 hover:border-primary-400 transition-colors text-sm whitespace-nowrap"
            >
              <MapPin size={14} className="nav-city-icon text-primary-700" />
              {selectedCity}
              <ChevronDown size={14} className={`transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </button>
            {cityOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-dark-100 shadow-card-hover py-1 min-w-[160px] z-50">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors ${city === selectedCity ? 'text-primary-700 font-semibold bg-primary-50' : 'text-dark-600'}`}
                  >
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary-500 shrink-0" />{city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liens navigation — occupe la place restante, jamais plus */}
          <div ref={linksBoxRef} className="relative hidden lg:flex flex-1 min-w-0 justify-center mx-2">
            {/* Copies invisibles servant uniquement à mesurer la largeur de chaque lien —
                rognées par un conteneur overflow-hidden pour ne jamais élargir la page. */}
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden invisible pointer-events-none">
              <div ref={measureRef} className="absolute left-0 top-0 w-max flex gap-1">
                {NAV_LINKS.map(l => <span key={l.href} data-v="n" data-href={l.href} className={LINK_CLASS}>{l.label}</span>)}
                <span data-v="n" data-plus className={`${LINK_CLASS} flex items-center gap-1`}>{t('more')} <ChevronDown size={13} /></span>
                {NAV_LINKS.map(l => <span key={`c${l.href}`} data-v="c" data-href={l.href} className={LINK_COMPACT}>{l.label}</span>)}
                <span data-v="c" data-plus className={`${LINK_COMPACT} flex items-center gap-1`}>{t('more')} <ChevronDown size={13} /></span>
              </div>
            </div>

            <div data-links className="flex items-center gap-1">
              {visibleLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
              {/* Plus dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                  className={`${linkClass} flex items-center gap-1`}
                  aria-expanded={moreOpen}
                >
                  {t('more')} <ChevronDown size={13} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-dark-100 shadow-card-hover py-1.5 min-w-[180px] z-50">
                    {overflowLinks.map(({ href, label, icon: Icon, color }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-dark-50 transition-colors text-sm text-dark-700 hover:text-dark-900 whitespace-nowrap"
                        onClick={() => setMoreOpen(false)}>
                        {Icon && <Icon size={15} className={color} />} {label}
                      </Link>
                    ))}
                    {overflowLinks.length > 0 && <div className="my-1 border-t border-dark-100" />}
                    {MORE_LINKS.map(({ href, label, icon: Icon, color }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-dark-50 transition-colors text-sm text-dark-700 hover:text-dark-900 whitespace-nowrap"
                        onClick={() => setMoreOpen(false)}>
                        <Icon size={15} className={color} /> {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Droite : seulement Publier, Messages, Notifications et le menu du compte */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/annonces/publier"
              className="nav-cta-gold btn-primary hidden sm:flex items-center gap-1.5 text-sm py-2 whitespace-nowrap"
            >
              <Plus size={16} />
              {t('publish')}
            </Link>
            <Link href="/messages" className={`${ICON_BTN} !hidden sm:!flex`} title={t('messaging')} aria-label={t('messaging')}>
              <MessageCircle size={18} />
            </Link>
            <Link href="/notifications" className={ICON_BTN} aria-label="Notifications">
              <Bell size={18} />
              {loggedIn && unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            <AccountMenu />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`${ICON_BTN} lg:!hidden`}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile — dropdown absolu : la navbar garde sa hauteur fixe h-16 */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-b border-dark-100 shadow-xl z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-dark-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-dark-100 pt-1 mt-1">
              {MORE_LINKS.map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-dark-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors">
                  <Icon size={14} className={color} /> {label}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-dark-500 text-xs font-medium">{t('changeLanguage')}</span>
              <LanguageSwitcher />
            </div>
            <Link
              href="/parametres"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-dark-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
            >
              <Settings size={13} /> {t('settings')}
            </Link>
            <button
              onClick={() => { setMobileOpen(false); openVoiceCall(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-semibold transition-colors"
            >
              <Phone size={13} /> {tVoice('button')}
            </button>
            {loggedIn && (
              <Link
                href="/abonnements"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-dark-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
              >
                <Users size={13} /> {t('mySubscriptions')}
              </Link>
            )}
            {loggedIn && (user.accountType === 'VENDEUR' || user.accountType === 'LES_DEUX') && (
              <Link
                href="/vendeur"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-semibold transition-colors border border-primary-200"
              >
                <Store size={13} /> {t('sellerSpace')}
              </Link>
            )}
            <div className="pt-2 border-t border-dark-100 flex gap-2">
              {loggedIn ? (
                <>
                  <Link
                    href="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-dark-600 border border-dark-200 rounded-xl hover:border-primary-400 hover:text-primary-700 transition-colors"
                  >
                    <MessageCircle size={14} /> {t('messages')}
                  </Link>
                  <Link
                    href="/profil"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2 text-sm font-semibold text-primary-700 border border-primary-700 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    {t('myProfile')}
                  </Link>
                  {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary-700 rounded-xl hover:bg-primary-800 transition-colors"
                      title="Admin"
                    >
                      <Shield size={14} />
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-white bg-guinea-600 rounded-xl hover:bg-guinea-700 transition-colors"
                  >
                    <LogOut size={14} /> {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/connexion"
                    className="flex-1 text-center py-2 text-sm font-semibold text-primary-700 border border-primary-700 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/auth/inscription"
                    className="flex-1 text-center py-2 text-sm font-semibold text-white bg-primary-700 rounded-xl hover:bg-primary-800 transition-colors"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
