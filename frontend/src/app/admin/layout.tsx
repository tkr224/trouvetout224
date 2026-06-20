'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ShoppingBag, AlertTriangle,
  Tag, LogOut, Home, Shield, ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/validation', label: 'À valider', icon: ClipboardCheck, exact: false, badge: true },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/admin/annonces', label: 'Annonces', icon: ShoppingBag },
  { href: '/admin/signalements', label: 'Signalements', icon: AlertTriangle },
  { href: '/admin/categories', label: 'Catégories', icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, logout, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Rafraîchit le profil depuis le serveur pour éviter les redirections
  // causées par un rôle obsolète dans le cache localStorage.
  useEffect(() => {
    if (!_hasHydrated) return;
    api.get('/users/me')
      .then(r => {
        if (r.data?.data) {
          const u = r.data.data;
          setUser({
            id: u.id, firstName: u.firstName, lastName: u.lastName,
            email: u.email ?? undefined, phone: u.phone ?? undefined,
            avatar: u.avatar ?? undefined, role: u.role, isVerified: u.isVerified,
          });
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  useEffect(() => {
    if (!_hasHydrated || !profileLoaded) return;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.replace('/');
    }
  }, [_hasHydrated, profileLoaded, user, router]);

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return;
    const fetchCount = () =>
      api.get('/admin/annonces/pending-count').then(r => setPendingCount(r.data.count || 0)).catch(() => {});
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [user]);

  if (!_hasHydrated || !profileLoaded || !user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-primary-400 animate-pulse" />
          <p className="text-white text-base font-semibold">Vérification des droits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 bg-dark-900 fixed h-full flex flex-col z-50 shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-premium">
              TT
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">
                TrouveTout<span className="text-gold-400">224</span>
              </p>
              <p className="text-dark-400 text-xs">Administration</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-700 text-white shadow-premium'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-dark-500'} />
                <span className="flex-1">{label}</span>
                {badge && pendingCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 leading-none">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + actions */}
        <div className="p-4 border-t border-dark-800 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 mb-2">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-primary-400 text-xs">
                {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 text-sm transition-colors"
          >
            <Home size={16} />
            Retour au site
          </Link>
          <button
            onClick={() => { logout(); router.replace('/'); }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-guinea-400 hover:text-white hover:bg-guinea-700/20 text-sm transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────────────── */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
