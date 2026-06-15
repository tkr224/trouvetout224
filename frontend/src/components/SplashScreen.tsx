'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const seen = sessionStorage.getItem('tt224-splash');
    if (seen) { setShow(false); return; }

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 2900);
    const t4 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('tt224-splash', '1');
    }, 3600);

    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, []);

  if (!show) return null;

  return (
    <div className={`splash-root ${phase === 3 ? 'splash-out' : ''}`}>
      <div className="halo halo-red" />
      <div className="halo halo-gold" />
      <div className="halo halo-green" />

      <div className="splash-center">
        <div className={`flag ${phase >= 1 ? 'flag-show' : ''} ${phase >= 3 ? 'flag-zoom' : ''}`}>
          <div className="band band-red" />
          <div className="band band-gold" />
          <div className="band band-green" />
          <div className={`shine ${phase >= 2 ? 'shine-go' : ''}`} />
        </div>

        {phase >= 1 && (
          <div className="particles">
            {[...Array(12)].map((_, i) => (
              <span key={i} className={`p p${i % 3}`} style={{ '--a': `${i * 30}deg`, '--d': `${0.3 + (i % 4) * 0.1}s` } as any} />
            ))}
          </div>
        )}

        <div className={`title ${phase >= 2 ? 'title-show' : ''}`}>
          <h1>
            <span className="t-green">TrouveTout</span><span className="t-gold">224</span>
          </h1>
          <p className={`tagline ${phase >= 2 ? 'tagline-show' : ''}`}>🇬🇳 La marketplace N°1 de Guinée</p>
        </div>
      </div>

      <style jsx>{`
        .splash-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: #ffffff;
          overflow: hidden;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .splash-out { opacity: 0; transform: scale(1.1); }

        .halo {
          position: absolute; border-radius: 50%;
          filter: blur(90px); opacity: 0;
          animation: haloIn 2.8s ease-out forwards;
        }
        .halo-red { width: 300px; height: 300px; background: #CE112655; top: 20%; left: 15%; animation-delay: 0.1s; }
        .halo-gold { width: 280px; height: 280px; background: #C9A84C55; bottom: 18%; right: 15%; animation-delay: 0.3s; }
        .halo-green { width: 320px; height: 320px; background: #1B8B3B44; top: 40%; left: 50%; animation-delay: 0.5s; }
        @keyframes haloIn { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; } 100% { opacity: 0.7; transform: scale(1); } }

        .splash-center { position: relative; display: flex; flex-direction: column; align-items: center; z-index: 10; }

        .flag {
          position: relative;
          display: flex;
          width: 0; height: 120px;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.18);
          opacity: 0;
          transition: width 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease, transform 0.6s ease;
        }
        .flag-show { width: 190px; opacity: 1; }
        .flag-zoom { transform: scale(0.85) translateY(-10px); }

        .band { flex: 1; transform: scaleX(0); transform-origin: left; }
        .band-red { background: #CE1126; animation: bandIn 0.5s ease 0.2s forwards; }
        .band-gold { background: #C9A84C; animation: bandIn 0.5s ease 0.35s forwards; }
        .band-green { background: #1B8B3B; animation: bandIn 0.5s ease 0.5s forwards; }
        @keyframes bandIn { to { transform: scaleX(1); } }

        .shine {
          position: absolute; top: 0; left: -60%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.7), transparent);
          transform: skewX(-20deg);
        }
        .shine-go { animation: shineMove 0.9s ease forwards; }
        @keyframes shineMove { from { left: -60%; } to { left: 160%; } }

        .particles { position: absolute; top: 60px; left: 50%; }
        .p {
          position: absolute; width: 8px; height: 8px; border-radius: 50%;
          transform: rotate(var(--a)) translateY(0);
          animation: scatter var(--d) ease-out forwards;
        }
        .p0 { background: #CE1126; }
        .p1 { background: #C9A84C; }
        .p2 { background: #1B8B3B; }
        @keyframes scatter {
          0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scale(1); }
          100% { opacity: 0; transform: rotate(var(--a)) translateY(90px) scale(0.3); }
        }

        .title { margin-top: 28px; opacity: 0; transform: translateY(20px) scale(0.9); transition: all 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        .title-show { opacity: 1; transform: translateY(0) scale(1); }
        .title h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; text-align: center; font-family: var(--font-poppins), sans-serif; }
        .t-green { color: #1B8B3B; }
        .t-gold { color: #C9A84C; }
        .tagline { text-align: center; color: #94a3b8; font-size: 0.875rem; margin-top: 8px; opacity: 0; transition: opacity 0.5s ease 0.3s; }
        .tagline-show { opacity: 1; }
      `}</style>
    </div>
  );
}