'use client';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';

/** Toaster global : position haute (jamais en bas), durée minimale 4s,
 *  bouton de fermeture manuelle sur toutes les notifications (succès/erreur/info),
 *  sans avoir à modifier les ~35 emplacements qui appellent toast.success/error. */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        success: { duration: 4000 },
        error: { duration: 5000 },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-2">
              {icon}
              <div className="flex-1">{message}</div>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  aria-label="Fermer"
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-dark-400 hover:text-dark-700 hover:bg-dark-100 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
