import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface LoadingPreloaderProps {
  onComplete: () => void;
}

export const LoadingPreloader: React.FC<LoadingPreloaderProps> = ({ onComplete }) => {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate logo entrance
    gsap.fromTo(logoRef.current,
      { 
        scale: 0.5, 
        opacity: 0,
        rotation: -180
      },
      { 
        scale: 1, 
        opacity: 1,
        rotation: 0,
        duration: 1,
        ease: "back.out(1.7)"
      }
    );

    // Progress animation
    const progressTl = gsap.timeline();
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          
          // Complete animation
          setTimeout(() => {
            gsap.to(preloaderRef.current, {
              opacity: 0,
              scale: 0.9,
              duration: 0.8,
              ease: "power2.inOut",
              onComplete: onComplete
            });
          }, 500);
          
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  useEffect(() => {
    // Animate progress bar
    gsap.to(progressRef.current, {
      width: `${progress}%`,
      duration: 0.3,
      ease: "power2.out"
    });
  }, [progress]);

  return (
    <div 
      ref={preloaderRef}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
    >
      <div className="text-center">
        {/* MW Logo */}
        <div 
          ref={logoRef}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 mx-auto glass-card flex items-center justify-center">
            <div className="text-4xl font-black text-gradient">
              MW
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-2xl bg-primary/20 blur-xl animate-pulse-neon" />
        </div>
        
        {/* Loading text */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Monad Messenger
        </h2>
        <p className="text-muted-foreground mb-8">
          Initializing blockchain connection...
        </p>
        
        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="glass h-2 rounded-full overflow-hidden">
            <div 
              ref={progressRef}
              className="h-full bg-gradient-primary transition-all duration-300 ease-out"
              style={{ width: '0%' }}
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
        
        {/* Loading dots */}
        <div className="loading-dots mt-6 justify-center">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};