'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { MapPin, ChevronDown, Bell, MessageCircle, User, Plus, Menu, X, LogOut, Shield, Settings, Store, Users, Wrench, Calendar, Building2, Car } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const NAV_LINK_HREFS = [
  { href: '/annonces/lister', key: 'annonces' },
  { href: '/boutiques',       key: 'boutiques' },
  { href: '/emplois',         key: 'emplois' },
  { href: '/restaurants',     key: 'restaurants' },
  { href: '/hotels',          key: 'hotels' },
] as const;

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

export default function Navbar({ selectedCity = 'Conakry', onCityChange }: NavbarProps) {
  const t = useTranslations('nav');
  const NAV_LINKS = NAV_LINK_HREFS.map((l) => ({ href: l.href, label: t(`links.${l.key}`) }));
  const MORE_LINKS = MORE_LINK_HREFS.map((l) => ({ ...l, label: t(`moreLinks.${l.key}`) }));
  const [cityOpen, setCityOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;

  useEffect(() => {
    if (!loggedIn) { setUnreadNotifs(0); return; }
    const fetchCount = () =>
      api.get('/notifications/unread-count').then(r => setUnreadNotifs(r.data.count || 0)).catch(() => {});
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [loggedIn]);

  const handleCitySelect = (city: string) => {
    onCityChange?.(city);
    setCityOpen(false);
  };

  return (
    <nav className="site-navbar bg-white border-b border-dark-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size={36} />
            <span className="font-display font-bold text-lg leading-none hidden sm:block">
              <span className="text-guinea-500">Trouve</span>
              <span className="text-gold-500">Tout</span>
              <span className="nav-brand-224 text-primary-700">224</span>
            </span>
          </Link>

          {/* Sélecteur de ville */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="nav-city-btn flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-200 text-dark-600 hover:border-primary-400 transition-colors text-sm"
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

          {/* Liens navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Plus dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className="nav-link flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {t('more')} <ChevronDown size={13} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-dark-100 shadow-card-hover py-1.5 min-w-[180px] z-50">
                  {MORE_LINKS.map(({ href, label, icon: Icon, color }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-dark-50 transition-colors text-sm text-dark-700 hover:text-dark-900"
                      onClick={() => setMoreOpen(false)}>
                      <Icon size={15} className={color} /> {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Droite */}
          <div className="flex items-center gap-2">
            <Link
              href="/annonces/publier"
              className="nav-cta-gold btn-primary hidden sm:flex items-center gap-1.5 text-sm py-2"
            >
              <Plus size={16} />
              {t('publish')}
            </Link>
            <Link
              href="/messages"
              className="nav-icon-btn hidden sm:flex relative w-9 h-9 items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors"
              title={t('messaging')}
            >
              <MessageCircle size={18} />
            </Link>
            {loggedIn && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
              <Link
                href="/admin"
                className="nav-icon-btn nav-icon-admin relative w-9 h-9 flex items-center justify-center rounded-xl border border-primary-300 text-primary-700 transition-colors"
                title={t('adminDashboard')}
              >
                <Shield size={17} />
              </Link>
            )}
            <LanguageSwitcher />
            <Link
              href="/notifications"
              className="nav-icon-btn relative w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors"
            >
              <Bell size={18} />
              {loggedIn && unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            <Link
              href="/parametres"
              className="nav-icon-btn hidden sm:flex w-9 h-9 items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors"
              title={t('settings')}
            >
              <Settings size={18} />
            </Link>
            {loggedIn ? (
              <Link
                href="/profil"
                className="nav-avatar w-9 h-9 flex items-center justify-center rounded-xl bg-primary-700 text-white font-bold text-xs overflow-hidden"
                title={`${user.firstName} ${user.lastName}`}
              >
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-9 h-9 object-cover" />
                  : `${user.firstName[0]}${user.lastName[0]}`}
              </Link>
            ) : (
              <Link
                href="/auth/connexion"
                className="nav-icon-btn w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors"
              >
                <User size={18} />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="nav-icon-btn w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 lg:hidden"
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
