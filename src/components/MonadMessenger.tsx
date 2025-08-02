import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { PaperPlaneRight, Wallet, CheckCircle, Clock, Warning, ArrowClockwise } from 'phosphor-react';
import { useToast } from '@/hooks/use-toast';

const CONTRACT_ADDRESS = "0xC89D21dDA2B9896BD6389a1f6fA58fFA1f6f18CA";

// Updated ABI with getMessages function
const CONTRACT_ABI = [
  "function sendMessage(string memory _text) public payable",
  "function getMessages() external view returns (tuple(address sender, string text)[] memory)",
  "event MessageSent(address indexed sender, string text)"
];

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  sender: string;
  isOnChain?: boolean;
}

interface MonadMessengerProps {
  className?: string;
}

export const MonadMessenger: React.FC<MonadMessengerProps> = ({ className }) => {
  const [wallet, setWallet] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use Monad Messenger",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      setWallet(accounts[0]);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!wallet || !message.trim()) return;

    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      content: message.trim(),
      timestamp: new Date(),
      status: 'pending',
      sender: wallet
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsSending(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.sendMessage(newMessage.content);
      
      // Update message with transaction hash
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, txHash: tx.hash }
          : msg
      ));

      toast({
        title: "Transaction Sent",
        description: `TX: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'confirmed' }
          : msg
      ));

      toast({
        title: "Message Confirmed",
        description: "Your message was recorded on Monad Testnet!",
      });

      // Reload messages to show the new on-chain message
      setTimeout(() => loadMessages(), 2000);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'failed' }
          : msg
      ));

      toast({
        title: "Transaction Failed",
        description: "Failed to send message to blockchain",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <Warning className="w-4 h-4 text-red-400" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const loadMessages = async () => {
    if (!window.ethereum) return;
    
    setIsLoadingMessages(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const onChainMessages = await contract.getMessages();
      
      const formattedMessages: Message[] = onChainMessages.map((msg: any, index: number) => ({
        id: `onchain-${index}`,
        content: msg.text,
        timestamp: new Date(), // Contract doesn't store timestamp, using current time
        status: 'confirmed' as const,
        sender: msg.sender,
        isOnChain: true
      }));
      
      // Filter out pending/failed local messages and merge with on-chain messages
      setMessages(prev => {
        const localPendingMessages = prev.filter(msg => !msg.isOnChain && msg.status !== 'confirmed');
        return [...formattedMessages, ...localPendingMessages];
      });
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Failed to Load Messages",
        description: "Could not fetch messages from blockchain",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages on component mount and when wallet connects
  useEffect(() => {
    if (wallet) {
      loadMessages();
    }
  }, [wallet]);

  return (
    <div className={`glass-card max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="border-b border-white/10 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gradient mb-2">
          Monad Messenger
        </h2>
        <p className="text-muted-foreground">
          Send messages directly to the blockchain
        </p>
        
        {/* Wallet Connection */}
        <div className="mt-4 flex items-center justify-between">
          {!wallet ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="btn-glow px-6 py-2 rounded-xl text-white font-medium flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <>
              <div className="glass px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{formatAddress(wallet)}</span>
              </div>
              <button
                onClick={loadMessages}
                disabled={isLoadingMessages}
                className="glass hover:bg-white/10 px-3 py-2 rounded-lg text-white/80 hover:text-white transition-all flex items-center gap-2"
                title="Refresh messages"
              >
                <ArrowClockwise className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                {isLoadingMessages ? 'Loading...' : 'Refresh'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="glass-card p-6 inline-block">
              Send your first message to the Monad blockchain!
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-bubble ${msg.status} fade-in-up in-view`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-2">{msg.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatAddress(msg.sender)}</span>
                    <span>•</span>
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.txHash && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://testnet.monadexplorer.com/tx/${msg.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:underline"
                        >
                          View Transaction
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message to send to blockchain..."
            disabled={!wallet || isSending}
            className="w-full bg-glass border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!wallet || !message.trim() || isSending}
          className="btn-glow px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : (
            <>
              <PaperPlaneRight className="w-5 h-5" />
              Send
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Messages are permanently stored on Monad Testnet blockchain
      </div>
    </div>
  );
};