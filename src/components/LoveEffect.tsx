import React, { useEffect, useState } from 'react';
import { Mail, Heart, X } from 'lucide-react';

const EMOJIS = ['🌹', '❤️', '💖', '🥀'];

export const LoveEffect: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; left: number; emoji: string; animationDuration: number; size: number; delay: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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

      {/* Floating Letter Icon */}
      <button 
        className="love-letter-trigger"
        onClick={() => setIsOpen(true)}
        title="Uma mensagem especial para você"
      >
        <Mail size={24} />
        <span className="heart-badge"><Heart size={12} fill="currentColor" /></span>
      </button>

      {/* Love Letter Modal */}
      {isOpen && (
        <div className="love-letter-overlay" onClick={() => setIsOpen(false)}>
          <div className="love-letter-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-letter" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
            <div className="letter-content">
              <Heart className="letter-heart" size={48} fill="#ff4d4d" color="#ff4d4d" />
              <h2>Para Isabella</h2>
              <p className="special-message">te amo minha gatinha</p>
              <div className="letter-footer">❤️</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
