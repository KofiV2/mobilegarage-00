import React, { useEffect, useState, useCallback, memo } from 'react';
import './Confetti.css';

/**
 * Beautiful confetti celebration effect
 * Renders colorful confetti pieces that fall from the top
 */
const Confetti = memo(function Confetti({ 
  active = false, 
  duration = 3000,
  pieces = 100,
  colors = ['#2563eb', '#f97316', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  spread = 180,
  gravity = 0.5
}) {
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const createParticle = useCallback((index) => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const startX = 50 + (Math.random() - 0.5) * spread;
    const endX = startX + (Math.random() - 0.5) * 100;
    const rotation = Math.random() * 720 - 360;
    const delay = Math.random() * 500;
    const fallDuration = 2000 + Math.random() * 1500;
    
    // Random shape
    const shapes = ['square', 'circle', 'triangle', 'ribbon'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    return {
      id: index,
      color,
      size,
      startX,
      endX,
      rotation,
      delay,
      fallDuration,
      shape,
      opacity: Math.random() * 0.5 + 0.5
    };
  }, [colors, spread]);

  const triggerConfetti = useCallback(() => {
    const newParticles = Array.from({ length: pieces }, (_, i) => createParticle(i));
    setParticles(newParticles);
    setIsActive(true);

    // Clean up after animation
    setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, duration + 2000);
  }, [pieces, createParticle, duration]);

  useEffect(() => {
    if (active) {
      triggerConfetti();
    }
  }, [active, triggerConfetti]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`confetti-piece confetti-piece--${particle.shape}`}
          style={{
            '--start-x': `${particle.startX}%`,
            '--end-x': `${particle.endX}%`,
            '--rotation': `${particle.rotation}deg`,
            '--delay': `${particle.delay}ms`,
            '--duration': `${particle.fallDuration}ms`,
            '--color': particle.color,
            '--size': `${particle.size}px`,
            '--opacity': particle.opacity
          }}
        />
      ))}
    </div>
  );
});

// Hook for programmatic confetti
export function useConfetti() {
  const [trigger, setTrigger] = useState(0);
  
  const celebrate = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  return { trigger, celebrate };
}

export default Confetti;
