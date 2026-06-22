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

/* ─── Éléments Halloween ────────────────────────────────────────────────── */
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

/* ─── Bulles (Océan profond) ─────────────────────────────────────────────── */
function BubbleOverlay() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id:     i,
        left:   `${pr(i * 3 + 600) * 100}%`,
        bottom: `${pr(i * 7 + 601) * 25}%`,
        size:   3 + pr(i * 5 + 602) * 12,
        dur:    4 + pr(i * 13 + 603) * 7,
        dly:    pr(i * 11 + 604) * 9,
        op:     0.12 + pr(i * 17 + 605) * 0.3,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="theme-bubble"
          style={{
            left:   b.left,
            bottom: b.bottom,
            width:  `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.op,
            ['--s-dur' as string]: `${b.dur}s`,
            ['--s-dly' as string]: `${b.dly}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Feuilles (Forêt) ───────────────────────────────────────────────────── */
const LEAVES = ['🍃', '🍂', '🌿', '🍃', '🍂'];
function LeafOverlay() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 700) * 100}%`,
        size:  14 + pr(i * 5 + 701) * 18,
        dur:   8 + pr(i * 13 + 702) * 12,
        dly:   pr(i * 11 + 703) * 15,
        drift: `${(pr(i * 19 + 704) - 0.5) * 80}px`,
        char:  LEAVES[i % LEAVES.length],
        op:    0.35 + pr(i * 17 + 705) * 0.45,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {leaves.map(l => (
        <span
          key={l.id}
          className="theme-leaf"
          style={{
            left:     l.left,
            fontSize: `${l.size}px`,
            opacity:  l.op,
            ['--s-dur'   as string]: `${l.dur}s`,
            ['--s-dly'   as string]: `${l.dly}s`,
            ['--s-drift' as string]: l.drift,
          }}
        >
          {l.char}
        </span>
      ))}
    </div>
  );
}

/* ─── Étoiles galactiques (Galaxie) ─────────────────────────────────────── */
function GalaxyOverlay() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 800) * 100}%`,
        top:   `${pr(i * 7 + 801) * 100}%`,
        size:  0.8 + pr(i * 5 + 802) * 3,
        dur:   1.5 + pr(i * 13 + 803) * 5,
        dly:   pr(i * 11 + 804) * 7,
        color: pr(i * 23 + 805) > 0.7 ? '#a78bfa' : pr(i * 29 + 806) > 0.5 ? '#38bdf8' : 'rgba(255,255,255,0.9)',
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="theme-star"
          style={{
            left:       s.left,
            top:        s.top,
            width:      `${s.size}px`,
            height:     `${s.size}px`,
            background: s.color,
            boxShadow:  `0 0 ${s.size * 2}px ${s.color}`,
            ['--s-dur' as string]: `${s.dur}s`,
            ['--s-dly' as string]: `${s.dly}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Braises / Étincelles (Lave) ───────────────────────────────────────── */
function EmberOverlay() {
  const embers = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 900) * 100}%`,
        bottom: `${pr(i * 7 + 901) * 20}%`,
        size:  2 + pr(i * 5 + 902) * 5,
        dur:   2.5 + pr(i * 13 + 903) * 4,
        dly:   pr(i * 11 + 904) * 6,
        drift: `${(pr(i * 19 + 905) - 0.5) * 60}px`,
        color: pr(i * 23 + 906) > 0.5 ? '#f97316' : '#ef4444',
        op:    0.5 + pr(i * 17 + 907) * 0.4,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {embers.map(e => (
        <div
          key={e.id}
          className="theme-ember"
          style={{
            left:         e.left,
            bottom:       e.bottom,
            width:        `${e.size}px`,
            height:       `${e.size}px`,
            background:   e.color,
            borderRadius: '50%',
            opacity:      e.op,
            boxShadow:    `0 0 ${e.size * 2}px ${e.color}`,
            ['--s-dur'   as string]: `${e.dur}s`,
            ['--s-dly'   as string]: `${e.dly}s`,
            ['--s-drift' as string]: e.drift,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Gouttes de pluie (Pluie) ───────────────────────────────────────────── */
function RainOverlay() {
  const drops = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id:     i,
        left:   `${pr(i * 3 + 1000) * 100}%`,
        height: 8 + pr(i * 5 + 1001) * 14,
        dur:    0.5 + pr(i * 13 + 1002) * 0.6,
        dly:    pr(i * 11 + 1003) * 2,
        op:     0.15 + pr(i * 17 + 1004) * 0.35,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {drops.map(d => (
        <div
          key={d.id}
          className="theme-raindrop"
          style={{
            left:   d.left,
            height: `${d.height}px`,
            opacity: d.op,
            ['--s-dur' as string]: `${d.dur}s`,
            ['--s-dly' as string]: `${d.dly}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Cristaux de glace (Glace / Hiver) ─────────────────────────────────── */
const ICE_CHARS = ['❄', '❅', '❆', '✦', '✧'];
function IceOverlay() {
  const crystals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id:    i,
        left:  `${pr(i * 3 + 1100) * 100}%`,
        size:  8 + pr(i * 5 + 1101) * 18,
        dur:   10 + pr(i * 13 + 1102) * 15,
        dly:   pr(i * 11 + 1103) * 18,
        drift: `${(pr(i * 19 + 1104) - 0.5) * 50}px`,
        char:  ICE_CHARS[i % ICE_CHARS.length],
        op:    0.3 + pr(i * 17 + 1105) * 0.5,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {crystals.map(c => (
        <span
          key={c.id}
          className="theme-crystal"
          style={{
            left:     c.left,
            fontSize: `${c.size}px`,
            opacity:  c.op,
            ['--s-dur'   as string]: `${c.dur}s`,
            ['--s-dly'   as string]: `${c.dly}s`,
            ['--s-drift' as string]: c.drift,
          }}
        >
          {c.char}
        </span>
      ))}
    </div>
  );
}

/* ─── Particules d'or (Or liquide) ─────────────────────────────────────── */
function GoldParticleOverlay() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id:     i,
        left:   `${pr(i * 3 + 1200) * 100}%`,
        top:    `${pr(i * 7 + 1201) * 100}%`,
        size:   2 + pr(i * 5 + 1202) * 5,
        dur:    5 + pr(i * 13 + 1203) * 8,
        dly:    pr(i * 11 + 1204) * 10,
        driftX: `${(pr(i * 19 + 1205) - 0.5) * 50}px`,
        driftY: `${-20 - pr(i * 23 + 1206) * 60}px`,
        op:     0.4 + pr(i * 17 + 1207) * 0.5,
      })),
    [],
  );
  return (
    <div className="theme-overlay" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="theme-gold-particle"
          style={{
            left:         p.left,
            top:          p.top,
            width:        `${p.size}px`,
            height:       `${p.size}px`,
            opacity:      p.op,
            ['--s-dur'    as string]: `${p.dur}s`,
            ['--s-dly'    as string]: `${p.dly}s`,
            ['--s-drift-x' as string]: p.driftX,
            ['--s-drift-y' as string]: p.driftY,
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

  if (active === 'nuit')         return <StarOverlay />;
  if (active === 'ramadan')      return <StarOverlay gold />;
  if (active === 'galaxie')      return <GalaxyOverlay />;
  if (active === 'noel')         return <SnowOverlay />;
  if (active === 'glace')        return <IceOverlay />;
  if (active === 'valentine')    return <HeartOverlay />;
  if (active === 'halloween')    return <HalloweenOverlay />;
  if (active === 'independence') return <ConfettiOverlay />;
  if (active === 'ocean')        return <BubbleOverlay />;
  if (active === 'foret')        return <LeafOverlay />;
  if (active === 'lave')         return <EmberOverlay />;
  if (active === 'pluie')        return <RainOverlay />;
  if (active === 'orliquide')    return <GoldParticleOverlay />;

  return null;
}
