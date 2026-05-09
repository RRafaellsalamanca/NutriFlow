import React, { useEffect, useState } from 'react';

const EMOJIS = ['🌹', '❤️', '💖', '🥀'];

export const LoveEffect: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; left: number; emoji: string; animationDuration: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // random left position
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      animationDuration: 3 + Math.random() * 5, // random speed
      size: 1 + Math.random() * 1.5, // random size
      delay: Math.random() * 5, // random start delay
    }));
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="love-effect-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="falling-particle"
          style={{
            left: `${p.left}vw`,
            animationDuration: `${p.animationDuration}s`,
            animationDelay: `${p.delay}s`,
            fontSize: `${p.size}rem`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};
