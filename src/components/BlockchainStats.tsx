import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cube, Lightning, Shield, Globe } from 'phosphor-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    icon: <Cube className="w-8 h-8" />,
    title: "Blockchain Secured",
    description: "Every message is permanently recorded on Monad Testnet",
    color: "primary"
  },
  {
    icon: <Lightning className="w-8 h-8" />,
    title: "Instant Confirmation",
    description: "Fast transaction processing with real-time status updates",
    color: "accent"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Immutable Records",
    description: "Messages cannot be altered or deleted once confirmed",
    color: "secondary"
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Decentralized",
    description: "No central authority controls your message data",
    color: "primary"
  }
];

export const BlockchainStats: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const cards = cardsRef.current;
    
    // Animate cards on scroll
    cards.forEach((card, index) => {
      gsap.fromTo(card,
        {
          opacity: 0,
          y: 100,
          scale: 0.8
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: index * 0.1,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Powered by Blockchain
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of messaging with decentralized technology
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              ref={el => el && (cardsRef.current[index] = el)}
              className="glass-card text-center group hover:scale-105 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-${stat.color} text-white`}>
                {stat.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">
                {stat.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {stat.description}
              </p>

              {/* Hover effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};