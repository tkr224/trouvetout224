'use client';
import { useEffect, useState } from 'react';

const PHRASES = [
  'Vends ton téléphone',
  'Trouve une maison',
  'Publie gratuitement',
  'Découvre les boutiques',
  'Cherche un emploi',
  'Loue une chambre',
];

export default function HeroRotatingText({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setShow(true);
      }, 350);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 350ms ease, transform 350ms ease',
      }}
    >
      {PHRASES[index]}
    </span>
  );
}
