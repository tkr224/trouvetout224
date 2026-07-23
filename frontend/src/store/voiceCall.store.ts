import { create } from 'zustand';

// État global minimal : juste "la fenêtre d'appel est-elle ouverte ?". Le
// composant VoiceCallScreen est monté une seule fois dans layout.tsx, et
// n'importe quel bouton "📞 Appeler l'assistant" (chatbot, page Aide, menu)
// appelle simplement open() — pas besoin de dupliquer l'écran d'appel.
interface VoiceCallStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useVoiceCallStore = create<VoiceCallStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
