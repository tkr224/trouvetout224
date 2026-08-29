// src/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string; firstName: string; lastName: string; email?: string;
  phone?: string; avatar?: string; role: string; isVerified: boolean;
  emailVerified?: boolean;
  onboardingDone?: boolean; createdAt?: string;
  accountType?: string; hasPassword?: boolean;
  username?: string; cityId?: string; city?: { id: string; name: string };
  preferredLanguage?: 'FR' | 'EN' | 'ZH';
}

export interface StoredAccount {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const MAX_ACCOUNTS = 5;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  // Comptes enregistrés sur cet appareil (max MAX_ACCOUNTS), y compris celui
  // actuellement actif — voir "Multi-comptes" dans Paramètres > Profil. Chaque
  // compte garde son propre refreshToken (sa propre session backend), switcher
  // ne fait que changer lequel est "actif" dans les champs ci-dessus.
  accounts: StoredAccount[];
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  // Déconnecte le compte ACTIF (révoque sa session côté serveur) et bascule sur un
  // autre compte enregistré s'il en reste, sinon repasse en état déconnecté.
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
  // Ajoute (ou fait passer en actif) un compte fraîchement connecté. Renvoie
  // `{ ok:false, reason:'limit' }` si on tente d'ajouter un 6e compte différent.
  addAccount: (user: User, accessToken: string, refreshToken: string) => { ok: boolean; reason?: 'limit' };
  switchAccount: (userId: string) => void;
  // Retire un compte de la liste (révoque sa session côté serveur). Si c'était le
  // compte actif, bascule sur un autre compte enregistré s'il en reste.
  removeAccount: (userId: string) => void;
}

// Fire-and-forget : révoque la session côté serveur. Ne bloque jamais l'action locale
// (déconnexion/suppression de compte) sur la réussite de cet appel réseau.
function revokeSession(refreshToken: string | null | undefined) {
  if (!refreshToken) return;
  axios.post(`${BASE_URL}/auth/logout`, { refreshToken }).catch(() => {});
}

function upsertAccount(accounts: StoredAccount[], account: StoredAccount): StoredAccount[] {
  const others = accounts.filter((a) => a.user.id !== account.user.id);
  return [...others, account];
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      accounts: [],
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken,
          // state.user vient d'être posé par setUser() juste avant (même tick,
          // appelé en séquence par tous les flows de connexion) — on l'utilise pour
          // garder la liste "accounts" synchronisée sans changer les appels existants.
          accounts: state.user ? upsertAccount(state.accounts, { user: state.user, accessToken, refreshToken }) : state.accounts,
        }));
      },
      logout: () => {
        const { refreshToken, user, accounts } = get();
        revokeSession(refreshToken);
        const remaining = accounts.filter((a) => a.user.id !== user?.id);
        if (remaining.length > 0) {
          const next = remaining[remaining.length - 1];
          set({ user: next.user, accessToken: next.accessToken, refreshToken: next.refreshToken, accounts: remaining, isAuthenticated: true });
        } else {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, accounts: [] });
        }
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      addAccount: (user, accessToken, refreshToken) => {
        const { accounts } = get();
        const isNewAccount = !accounts.some((a) => a.user.id === user.id);
        if (isNewAccount && accounts.length >= MAX_ACCOUNTS) {
          return { ok: false, reason: 'limit' };
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          accounts: upsertAccount(accounts, { user, accessToken, refreshToken }),
        });
        return { ok: true };
      },
      switchAccount: (userId) => {
        const { accounts } = get();
        const account = accounts.find((a) => a.user.id === userId);
        if (!account) return;
        set({ user: account.user, accessToken: account.accessToken, refreshToken: account.refreshToken, isAuthenticated: true });
      },
      removeAccount: (userId) => {
        const { accounts, user } = get();
        const target = accounts.find((a) => a.user.id === userId);
        if (target) revokeSession(target.refreshToken);
        const remaining = accounts.filter((a) => a.user.id !== userId);

        if (user?.id !== userId) {
          // On retire un compte qui n'est pas l'actif : rien d'autre à changer.
          set({ accounts: remaining });
          return;
        }
        if (remaining.length > 0) {
          const next = remaining[remaining.length - 1];
          set({ user: next.user, accessToken: next.accessToken, refreshToken: next.refreshToken, accounts: remaining, isAuthenticated: true });
        } else {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, accounts: [] });
        }
      },
    }),
    {
      name: 'tt224-auth',
      // Ne persiste que les données de session, pas l'état transitoire
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        accounts: state.accounts,
      }),
      // Signale aux composants que la lecture localStorage est terminée
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
