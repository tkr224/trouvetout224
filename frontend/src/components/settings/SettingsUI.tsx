'use client';
// Briques visuelles communes de la page Paramètres — même langage que le menu
// déroulant de l'avatar (Navbar) : surfaces sobres, bordures fines, icônes fines,
// espacement compact. bg-white / border-dark-200 / text-dark-* sont automatiquement
// convertis en mode sombre par les règles globales (styles/globals.css).
import type { LucideIcon } from 'lucide-react';

export function SettingsCard({
  icon: Icon, title, description, actions, footer, children, className = '', bodyClassName = 'p-4 sm:p-5 space-y-4', id,
}: {
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Élément aligné à droite du titre (ex : bouton « Ajouter »). */
  actions?: React.ReactNode;
  /** Pied de carte : boutons d'action, alignés à droite. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`settings-card bg-white border border-dark-200 rounded-2xl ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-dark-100">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold text-dark-900 flex items-center gap-2 leading-snug">
                {Icon && <Icon size={16} strokeWidth={1.75} className="text-primary-700 shrink-0" />}
                <span className="min-w-0">{title}</span>
              </h2>
            )}
            {description && <p className="text-xs text-dark-500 mt-1 leading-relaxed">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children !== undefined && children !== null && children !== false && <div className={bodyClassName}>{children}</div>}
      {footer && (
        <footer className="px-4 sm:px-5 py-3 border-t border-dark-100 flex items-center justify-end gap-2 flex-wrap">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Interrupteur purement visuel — la ligne entière est le bouton (cible tactile ≥ 44px). */
export function Toggle({ value }: { value: boolean }) {
  return (
    <span aria-hidden className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${value ? 'bg-primary-600' : 'bg-dark-300'}`}>
      <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
    </span>
  );
}

/** Ligne réglage + interrupteur, à placer dans une liste `divide-y`. */
export function ToggleRow({ label, sub, value, onClick }: { label: string; sub?: string; value: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} role="switch" aria-checked={value}
      className="settings-row w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-3 min-h-[56px] text-left">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-dark-900">{label}</span>
        {sub && <span className="block text-xs text-dark-500 mt-0.5">{sub}</span>}
      </span>
      <Toggle value={value} />
    </button>
  );
}

/** Classe d'une tuile de choix (thème, taille de texte, couleur…). */
export const tileClass = (active: boolean) =>
  `settings-tile flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${active ? 'is-active' : ''}`;

/** Bouton principal compact (pied de carte). */
export const primaryBtn = 'btn-primary !shadow-none !px-4 !py-2 text-sm inline-flex items-center gap-2 disabled:opacity-60';
/** Bouton secondaire discret. */
export const secondaryBtn = 'settings-btn-secondary inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-dark-200 text-sm font-medium text-dark-700 transition-colors disabled:opacity-60';
/** Lien d'action discret (texte vert). */
export const linkBtn = 'text-sm font-medium text-primary-700 hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1.5';
