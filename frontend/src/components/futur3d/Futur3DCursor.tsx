'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; hue: number;
}

export default function Futur3DCursor() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mouseRef   = useRef({ x: -200, y: -200 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef     = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    document.documentElement.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x:       e.clientX + (Math.random() - 0.5) * 8,
          y:       e.clientY + (Math.random() - 0.5) * 8,
          vx:      (Math.random() - 0.5) * 2,
          vy:      (Math.random() - 0.5) * 2 - 0.5,
          life:    1,
          maxLife: 0.4 + Math.random() * 0.6,
          size:    1.5 + Math.random() * 3,
          hue:     185 + Math.random() * 35,
        });
      }
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200);
      }
    };

    const onClick = (e: MouseEvent) => {
      // Explosion radiale au clic
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: e.clientX, y: e.clientY,
          vx:   Math.cos(angle) * speed,
          vy:   Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.4,
          size:    2 + Math.random() * 4,
          hue:     175 + Math.random() * 60,
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      // Particules trail
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.04;
        p.vx *= 0.97;
        p.life -= 0.016 / p.maxLife;
        const a = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fillStyle   = `hsla(${p.hue}, 100%, 70%, ${a * 0.85})`;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      const { x, y } = mouseRef.current;
      if (x > -100) {
        // Anneau rotatif extérieur
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 1.8);
        const ringGrad = ctx.createLinearGradient(-18, 0, 18, 0);
        ringGrad.addColorStop(0,   'rgba(0,220,255,0)');
        ringGrad.addColorStop(0.5, 'rgba(0,220,255,0.95)');
        ringGrad.addColorStop(1,   'rgba(0,220,255,0)');
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = '#00dcff';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 1.4);
        ctx.stroke();

        // Second anneau inversé
        ctx.rotate(Math.PI);
        const ringGrad2 = ctx.createLinearGradient(-18, 0, 18, 0);
        ringGrad2.addColorStop(0,   'rgba(125,211,252,0)');
        ringGrad2.addColorStop(0.5, 'rgba(125,211,252,0.7)');
        ringGrad2.addColorStop(1,   'rgba(125,211,252,0)');
        ctx.strokeStyle = ringGrad2;
        ctx.lineWidth   = 0.8;
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 1.0);
        ctx.stroke();
        ctx.restore();

        // Point central (dot lumineux)
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, 3);
        dotGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        dotGrad.addColorStop(1, 'rgba(0, 220, 255, 0.8)');
        ctx.fillStyle   = dotGrad;
        ctx.shadowBlur  = 18;
        ctx.shadowColor = '#00dcff';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Réticule croisé
        ctx.strokeStyle = 'rgba(0, 220, 255, 0.28)';
        ctx.lineWidth   = 0.5;
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.moveTo(x - 25, y); ctx.lineTo(x - 20, y);
        ctx.moveTo(x + 20, y); ctx.lineTo(x + 25, y);
        ctx.moveTo(x, y - 25); ctx.lineTo(x, y - 20);
        ctx.moveTo(x, y + 20); ctx.lineTo(x, y + 25);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      document.documentElement.style.cursor = '';
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}
