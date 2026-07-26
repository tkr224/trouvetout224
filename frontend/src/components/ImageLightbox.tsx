'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  alt?: string;
}

// Visionneuse plein écran réutilisable : galerie d'annonce, bannière/photo de
// profil, logo de boutique... L'image grande résolution n'est montée dans le
// DOM que pendant que ce composant est affiché (le parent ne le rend qu'à
// l'ouverture), donc rien n'est chargé en avance.
export default function ImageLightbox({ images, index, onClose, onIndexChange, alt = '' }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const count = images.length;

  const goTo = useCallback((i: number) => {
    setScale(1);
    onIndexChange?.((i + count) % count);
  }, [count, onIndexChange]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) goPrev();
      else if (e.key === 'ArrowRight' && count > 1) goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goPrev, goNext, count]);

  const touchDistance = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = touchDistance(e.touches);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const ratio = touchDistance(e.touches) / pinchStartDist.current;
      setScale(Math.min(4, Math.max(1, pinchStartScale.current * ratio)));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (scale === 1 && touchStartX.current !== null && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 50 && count > 1) {
        if (dx > 0) goPrev(); else goNext();
      }
    }
    touchStartX.current = null;
    pinchStartDist.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Fermer"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
      >
        <X size={20} />
      </button>

      {count > 1 && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          {index + 1}/{count}
        </div>
      )}

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Image précédente"
            className="absolute left-2 sm:left-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Image suivante"
            className="absolute right-2 sm:right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); setScale((s) => (s > 1 ? 1 : 2)); }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `scale(${scale})` }}
        className="max-w-full max-h-full object-contain rounded select-none touch-none transition-transform duration-150"
        draggable={false}
      />
    </div>
  );
}
