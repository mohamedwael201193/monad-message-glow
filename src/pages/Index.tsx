import React, { useState, useEffect } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { MonadMessenger } from '@/components/MonadMessenger';
import { BlockchainStats } from '@/components/BlockchainStats';
import { LoadingPreloader } from '@/components/LoadingPreloader';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Initialize smooth scrolling when loading completes
  useEffect(() => {
    if (!isLoading) {
      // Add any additional initialization here
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isLoading]);

  return (
    <>
      {/* Loading Preloader */}
      {isLoading && <LoadingPreloader onComplete={handleLoadingComplete} />}
      
      {/* Main Content */}
      <div className={`min-h-screen transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Blockchain Stats */}
        <BlockchainStats />
        
        {/* Main Messenger Section */}
        <section id="messenger" className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Send Your Message
            </h2>
            <p className="text-xl text-muted-foreground">
              Connect your wallet and send messages directly to the Monad blockchain
            </p>
          </div>
          
          <MonadMessenger className="mb-12" />
          
          {/* Additional Info */}
          <div className="max-w-2xl mx-auto mt-16">
            <div className="glass-card text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                How It Works
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Your Wallet</h4>
                    <p className="text-muted-foreground text-sm">Link your MetaMask wallet to Monad Testnet</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-background text-sm font-bold mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Type Your Message</h4>
                    <p className="text-muted-foreground text-sm">Enter any message you want to store forever</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-secondary flex items-center justify-center text-white text-sm font-bold mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Sign & Send</h4>
                    <p className="text-muted-foreground text-sm">Confirm the transaction and your message goes on-chain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card inline-block px-6 py-3 mb-4">
              <span className="text-gradient font-bold text-lg">MW</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Monad Messenger - Decentralized communication on the blockchain
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="https://docs.monad.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                Monad Docs
              </a>
              <a href="https://monad.blockvision.org" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                Block Explorer
              </a>
              <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                Get MetaMask
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;