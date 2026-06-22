'use client';
import { useMemo } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

/* ─── Pseudo-aléatoire déterministe (pas de Math.random → pas de diff SSR) */
function pr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ─── Étoiles (nuit étoilée + Ramadan) ─────────────────────────────────── */
function StarOverlay({ gold = false }: { gold?: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${pr(i * 3 + 1) * 100}%`,
        top:  `${pr(i * 7 + 2) * 100}%`,
        size: 1.2 + pr(i * 5 + 3) * 2.8,
        dur:  2.2 + pr(i * 13 + 4) * 4.5,
        dly:  pr(i * 11 + 5) * 6,
        isGold: gold && pr(i * 23 + 6) > 0.45,
      })),
    [gold],
  );

  return (
    <div className="theme-overlay" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="theme-star"
          style={{
            left:   s.left,
            top:    s.top,
            width:  `${s.size}px`,
            height: `${s.size}px`,
            background: s.isGold ? '#fcd34d' : 'rgba(255,255,255,0.9)',
            boxShadow:  s.isGold
              ? `0 0 ${s.size * 2}px #fcd34d`
              : `0 0 ${s.size * 1.5}px rgba(200,220,255,0.8)`,
            ['--s-dur' as string]: `${s.dur}s`,
            ['--s-dly' as string]: `${s.dly}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Flocons de neige (Noël) ────────────────────────────────────────────── */
const FLAKES = ['❄', '❅', '❆'];
function SnowOverlay() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 100) * 100}%`,
        size:  10 + pr(i * 5 + 101) * 16,
        dur:   6 + pr(i * 13 + 102) * 10,
        dly:   pr(i * 11 + 103) * 12,
        drift: `${(pr(i * 19 + 104) - 0.5) * 70}px`,
        char:  FLAKES[i % 3],
        op:    0.45 + pr(i * 17 + 105) * 0.45,
      })),
    [],
  );

  return (
    <div className="theme-overlay" aria-hidden="true">
      {flakes.map(f => (
        <span
          key={f.id}
          className="theme-snowflake"
          style={{
            left:     f.left,
            fontSize: `${f.size}px`,
            opacity:  f.op,
            ['--s-dur'   as string]: `${f.dur}s`,
            ['--s-dly'   as string]: `${f.dly}s`,
            ['--s-drift' as string]: f.drift,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}

/* ─── Cœurs flottants (Saint-Valentin) ──────────────────────────────────── */
const HEARTS = ['❤', '♡', '💕', '❤', '♡'];
function HeartOverlay() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id:   i,
        left: `${pr(i * 3 + 200) * 100}%`,
        size: 12 + pr(i * 5 + 201) * 22,
        dur:  7 + pr(i * 13 + 202) * 10,
        dly:  pr(i * 11 + 203) * 14,
        char: HEARTS[i % HEARTS.length],
        op:   0.2 + pr(i * 17 + 204) * 0.45,
      })),
    [],
  );

  return (
    <div className="theme-overlay" aria-hidden="true">
      {hearts.map(h => (
        <span
          key={h.id}
          className="theme-heart"
          style={{
            left:     h.left,
            fontSize: `${h.size}px`,
            opacity:  h.op,
            color:    pr(h.id * 7 + 205) > 0.5 ? '#f9a8d4' : '#fb7185',
            ['--s-dur' as string]: `${h.dur}s`,
            ['--s-dly' as string]: `${h.dly}s`,
          }}
        >
          {h.char}
        </span>
      ))}
    </div>
  );
}

/* ─── Éléments Halloween (chauves-souris + citrouilles + fantômes) ──────── */
const SPOOKY = ['🦇', '🎃', '👻', '🦇', '🦇', '🎃'];
function HalloweenOverlay() {
  const items = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id:   i,
        left: `${pr(i * 3 + 300) * 100}%`,
        top:  `${15 + pr(i * 7 + 301) * 72}%`,
        size: 14 + pr(i * 5 + 302) * 22,
        dur:  10 + pr(i * 13 + 303) * 14,
        dly:  pr(i * 11 + 304) * 8,
        char: SPOOKY[i % SPOOKY.length],
        op:   0.12 + pr(i * 17 + 305) * 0.25,
      })),
    [],
  );

  return (
    <div className="theme-overlay" aria-hidden="true">
      {items.map(it => (
        <span
          key={it.id}
          className="theme-halloween"
          style={{
            left:     it.left,
            top:      it.top,
            fontSize: `${it.size}px`,
            opacity:  it.op,
            ['--s-dur' as string]: `${it.dur}s`,
            ['--s-dly' as string]: `${it.dly}s`,
          }}
        >
          {it.char}
        </span>
      ))}
    </div>
  );
}

/* ─── Confettis patriotiques (Indépendance Guinée) ──────────────────────── */
const GN_COLORS = ['#CE1126', '#C9A84C', '#1B8B3B'];
function ConfettiOverlay() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 500) * 100}%`,
        size:  4 + pr(i * 5 + 501) * 7,
        dur:   6 + pr(i * 13 + 502) * 8,
        dly:   pr(i * 11 + 503) * 10,
        color: GN_COLORS[i % 3],
        op:    0.3 + pr(i * 17 + 504) * 0.45,
        round: pr(i * 23 + 505) > 0.5 ? '50%' : '2px',
      })),
    [],
  );

  return (
    <div className="theme-overlay" aria-hidden="true">
      {confetti.map(c => (
        <div
          key={c.id}
          className="theme-confetti"
          style={{
            left:         c.left,
            width:        `${c.size}px`,
            height:       `${c.size}px`,
            background:   c.color,
            borderRadius: c.round,
            opacity:      c.op,
            ['--s-dur' as string]: `${c.dur}s`,
            ['--s-dly' as string]: `${c.dly}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function ThemeAnimations() {
  const { colorAccent, specialTheme } = useTheme();
  const active = specialTheme ?? colorAccent;

  if (active === 'nuit')        return <StarOverlay />;
  if (active === 'ramadan')     return <StarOverlay gold />;
  if (active === 'noel')        return <SnowOverlay />;
  if (active === 'valentine')   return <HeartOverlay />;
  if (active === 'halloween')   return <HalloweenOverlay />;
  if (active === 'independence') return <ConfettiOverlay />;

  return null;
}
