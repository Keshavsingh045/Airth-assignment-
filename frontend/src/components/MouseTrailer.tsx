import React, { useEffect, useRef } from 'react';

const AirthIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="currentColor"
  >
    <path d="M16 48 C16 48 24 50 24 64 L24 82 C24 87 18 89 16 82 Z" />
    <path d="M32 82 C32 40 50 16 70 16 C70 48 62 82 32 82 Z" />
  </svg>
);

export function MouseTrailer() {
  const iconRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const pos = { x: -100, y: -100 };

    const animate = () => {
      // Calculate distance to mouse
      const dx = mouse.current.x + 25 - pos.x;
      const dy = mouse.current.y + 25 - pos.y;

      // Smooth lerp towards mouse
      pos.x += dx * 0.15;
      pos.y += dy * 0.15;

      // Calculate a slight rotation based on horizontal velocity
      const rotation = Math.max(-25, Math.min(25, dx * 0.15));

      if (iconRef.current) {
        iconRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg)`;
        if (mouse.current.x !== -100) {
          iconRef.current.style.opacity = '1';
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <div
        ref={iconRef}
        className="absolute left-0 top-0 h-8 w-8 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]"
        style={{
          opacity: 0,
          willChange: 'transform, opacity',
          transition: 'opacity 0.3s ease',
        }}
      >
        <AirthIcon className="h-full w-full" />
      </div>
    </div>
  );
}
