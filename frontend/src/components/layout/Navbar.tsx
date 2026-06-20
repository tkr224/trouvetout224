'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { MapPin, ChevronDown, Bell, MessageCircle, User, Plus, Menu, X, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const NAV_LINKS = [
  { href: '/annonces/lister', label: 'Annonces' },
  { href: '/emplois', label: 'Emplois' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/hotels', label: 'Hôtels' },
];

interface NavbarProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export default function Navbar({ selectedCity = 'Conakry', onCityChange }: NavbarProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <nav className="bg-white border-b border-dark-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size={36} />
            <span className="font-display font-bold text-lg leading-none hidden sm:block">
              <span className="text-guinea-500">Trouve</span>
              <span className="text-gold-500">Tout</span>
              <span className="text-primary-700">224</span>
            </span>
          </Link>

          {/* Sélecteur de ville */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-200 text-dark-600 hover:border-primary-400 transition-colors text-sm"
            >
              <MapPin size={14} className="text-primary-700" />
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
                className="px-3 py-2 text-dark-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Droite */}
          <div className="flex items-center gap-2">
            <Link
              href="/annonces/publier"
              className="btn-primary hidden sm:flex items-center gap-1.5 text-sm py-2"
            >
              <Plus size={16} />
              Publier
            </Link>
            <Link
              href="/messages"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors"
              title="Messagerie"
            >
              <MessageCircle size={18} />
            </Link>
            {loggedIn && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
              <Link
                href="/admin"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-500 transition-colors"
                title="Tableau de bord Admin"
              >
                <Shield size={17} />
              </Link>
            )}
            <Link
              href="/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors"
            >
              <Bell size={18} />
              {loggedIn && unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </Link>
            {loggedIn ? (
              <Link
                href="/profil"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-700 text-white font-bold text-xs overflow-hidden"
                title={`${user.firstName} ${user.lastName}`}
              >
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-9 h-9 object-cover" />
                  : `${user.firstName[0]}${user.lastName[0]}`}
              </Link>
            ) : (
              <Link
                href="/auth/connexion"
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary-400 hover:text-primary-700 transition-colors"
              >
                <User size={18} />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-dark-100 py-3 space-y-1">
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
            <div className="pt-2 border-t border-dark-100 flex gap-2">
              {loggedIn ? (
                <>
                  <Link
                    href="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-dark-600 border border-dark-200 rounded-xl hover:border-primary-400 hover:text-primary-700 transition-colors"
                  >
                    <MessageCircle size={14} /> Messages
                  </Link>
                  <Link
                    href="/profil"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2 text-sm font-semibold text-primary-700 border border-primary-700 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    Mon profil
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
                    <LogOut size={14} /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/connexion"
                    className="flex-1 text-center py-2 text-sm font-semibold text-primary-700 border border-primary-700 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/inscription"
                    className="flex-1 text-center py-2 text-sm font-semibold text-white bg-primary-700 rounded-xl hover:bg-primary-800 transition-colors"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
