'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_LINES = [
  { text: '◈ TROUVETOUT224 ADMIN SYSTEM v2.0 ◈', accent: true },
  { text: '' },
  { text: '> CHARGEMENT PROTOCOLE 3D FUTUR ........ OK', accent: false },
  { text: '> MOTEUR SPATIAL HOLOGRAPHIQUE ......... OK', accent: false },
  { text: '> TRACKING CURSEUR QUANTIQUE ........... OK', accent: false },
  { text: '> PARTICULES ET EFFETS 3D .............. OK', accent: false },
  { text: '> VÉRIFICATION ACCÈS ADMINISTRATEUR .... ✓', accent: false },
  { text: '' },
  { text: 'BIENVENUE, ADMINISTRATEUR', accent: true },
];

function CornerDecoration({ top, left }: { top: boolean; left: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      style={{
        position: 'absolute',
        width: 48, height: 48,
        ...(top    ? { top: 28 }    : { bottom: 28 }),
        ...(left   ? { left: 28 }   : { right: 28 }),
        borderTop:    top    ? '2px solid rgba(0,220,255,0.5)' : 'none',
        borderBottom: !top   ? '2px solid rgba(0,220,255,0.5)' : 'none',
        borderLeft:   left   ? '2px solid rgba(0,220,255,0.5)' : 'none',
        borderRight:  !left  ? '2px solid rgba(0,220,255,0.5)' : 'none',
      }}
    />
  );
}

export default function Futur3DHUD() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, exit: { duration: 0.7 } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'radial-gradient(ellipse at center, #06063a 0%, #01000f 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {/* Décorations de coins HUD */}
          <CornerDecoration top left />
          <CornerDecoration top={true}  left={false} />
          <CornerDecoration top={false} left={true} />
          <CornerDecoration top={false} left={false} />

          {/* Lignes de scan horizontales */}
          {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.08 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              style={{
                position: 'absolute',
                left: '5%', right: '5%',
                top: `${y * 100}%`,
                height: 1,
                background: 'linear-gradient(to right, transparent, rgba(0,220,255,0.8), transparent)',
                transformOrigin: 'center',
              }}
            />
          ))}

          {/* Contenu central */}
          <div style={{ textAlign: 'center', fontFamily: "'Courier New', monospace", zIndex: 1 }}>
            {/* Icône rocket avec spring */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotateZ: -45 }}
              animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.2 }}
              style={{ fontSize: 56, marginBottom: 28, filter: 'drop-shadow(0 0 24px #00dcff)' }}
            >
              🚀
            </motion.div>

            {/* Lignes de démarrage */}
            {BOOT_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.2, duration: 0.3, ease: 'easeOut' }}
                style={{
                  fontSize:     line.accent ? (i === BOOT_LINES.length - 1 ? 22 : 12) : 11,
                  fontWeight:   line.accent ? 'bold' : 'normal',
                  letterSpacing: line.accent ? '0.35em' : '0.1em',
                  color:        line.accent
                    ? (i === BOOT_LINES.length - 1 ? '#7dd3fc' : '#00dcff')
                    : 'rgba(0, 200, 255, 0.72)',
                  textShadow:   line.accent ? '0 0 16px #00dcff' : 'none',
                  marginBottom: i === BOOT_LINES.length - 2 ? 18 : 5,
                  minHeight:    16,
                }}
              >
                {line.text}
              </motion.div>
            ))}

            {/* Barre de progression */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}
            >
              <div style={{
                width: 320, height: 2,
                background: 'rgba(0, 220, 255, 0.15)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3.2, delay: 0.6, ease: 'linear' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(to right, #0ea5e9, #00dcff, #7dd3fc)',
                    boxShadow: '0 0 10px #00dcff',
                  }}
                />
              </div>
            </motion.div>

            {/* Label pourcentage */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              style={{ marginTop: 8, fontSize: 10, color: '#00dcff', letterSpacing: '0.2em' }}
            >
              CHARGEMENT EN COURS...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
