import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowDown } from 'phosphor-react';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });
    
    // Animate title
    tl.fromTo(titleRef.current,
      { 
        opacity: 0, 
        y: 100,
        scale: 0.8
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "back.out(1.7)"
      }
    );

    // Animate subtitle
    tl.fromTo(subtitleRef.current,
      { 
        opacity: 0, 
        y: 50 
      },
      { 
        opacity: 1, 
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      },
      "-=0.6"
    );

    // Animate CTA
    tl.fromTo(ctaRef.current,
      { 
        opacity: 0, 
        y: 30 
      },
      { 
        opacity: 1, 
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.4"
    );

    // Floating animation for the scroll indicator
    gsap.to(".scroll-indicator", {
      y: 10,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

  }, []);

  const scrollToMessenger = () => {
    const messengerSection = document.getElementById('messenger');
    if (messengerSection) {
      messengerSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={heroRef}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
      
      {/* 3D Spline Background */}
      <div className="absolute inset-0 opacity-60">
        <iframe 
          src="https://my.spline.design/orb-KYTqPIQ7TdFeIKzLRR8OmQ1u/" 
          frameBorder="0" 
          width="100%" 
          height="100%"
          style={{ border: 'none' }}
          title="3D Orb Background"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Main Title */}
        <h1 
          ref={titleRef}
          className="text-6xl md:text-8xl font-black mb-6 leading-tight"
        >
          <span className="text-gradient block">MONAD</span>
          <span className="text-white block">MESSENGER</span>
        </h1>
        
        {/* Subtitle */}
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Send messages directly to the blockchain. 
          <br className="hidden md:block" />
          <span className="text-gradient-accent font-medium">
            Immutable. Decentralized. Forever.
          </span>
        </p>
        
        {/* CTA Section */}
        <div ref={ctaRef} className="space-y-6">
          <button
            onClick={scrollToMessenger}
            className="btn-glow px-8 py-4 rounded-2xl text-white font-semibold text-lg hover:scale-105 transition-transform"
          >
            Start Messaging
          </button>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Monad Testnet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>MetaMask Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Decentralized</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div 
        className="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        onClick={scrollToMessenger}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
          <span className="text-sm font-medium">Scroll to explore</span>
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
      <div className="absolute top-1/3 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
    </section>
  );
};