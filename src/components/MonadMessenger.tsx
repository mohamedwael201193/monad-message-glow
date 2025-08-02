import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { PaperPlaneRight, Wallet, CheckCircle, Clock, Warning, ArrowClockwise } from 'phosphor-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const CONTRACT_ADDRESS = "0xC89D21dDA2B9896BD6389a1f6fA58fFA1f6f18CA";

// Updated ABI for event-based messaging
const CONTRACT_ABI = [
  "function sendMessage(string memory _text) public payable",
  "event MessageSent(address indexed sender, string text, uint256 timestamp)"
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
      
      console.log('Loading messages from blockchain events...');
      
      // Get messages from events (last 5000 blocks for better performance)
      const filter = contract.filters.MessageSent();
      const events = await contract.queryFilter(filter, -5000);
      
      // Get current block number for 24-hour filtering
      const currentBlock = await provider.getBlockNumber();
      const ONE_DAY_BLOCKS = 6500; // Approximately 24 hours in blocks (assuming 13s block time)
      
      console.log(`Found ${events.length} total events, current block: ${currentBlock}`);
      
      // Get block details for each event to get timestamps
      const eventMessages: Message[] = [];
      
      for (const event of events) {
        // Type guard to ensure we have an EventLog with args
        if (!('args' in event) || !event.args) {
          continue;
        }
        
        // Filter out messages older than 24 hours (based on block numbers)
        const blockAge = currentBlock - event.blockNumber;
        if (blockAge > ONE_DAY_BLOCKS) {
          continue; // Skip old messages
        }
        
        // Get block to extract timestamp
        let blockTimestamp;
        try {
          const block = await provider.getBlock(event.blockNumber);
          blockTimestamp = new Date(block!.timestamp * 1000);
        } catch (error) {
          console.error('Failed to get block timestamp:', error);
          blockTimestamp = new Date(); // Fallback to current time
        }
        
        eventMessages.push({
          id: `event-${event.blockNumber}-${event.index || 0}`,
          content: event.args.text || event.args.message || 'Unknown message',
          timestamp: blockTimestamp,
          status: 'confirmed' as const,
          sender: event.args.sender || 'Unknown',
          isOnChain: true,
          txHash: event.transactionHash
        });
      }
      
      // Sort messages by timestamp (newest first)
      eventMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      console.log(`Loaded ${eventMessages.length} recent messages (within 24 hours)`);
      
      // Merge with local pending messages
      setMessages(prev => {
        const localPendingMessages = prev.filter(msg => !msg.isOnChain && (msg.status === 'pending' || msg.status === 'failed'));
        return [...localPendingMessages, ...eventMessages];
      });
      
    } catch (error) {
      console.error('Failed to load messages from blockchain:', error);
      toast({
        title: "Failed to Load Messages",
        description: "Could not fetch messages from blockchain. Please check your network connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages on component mount and when wallet connects
  useEffect(() => {
    loadMessages(); // Load messages for everyone, even without wallet connection
  }, []);

  useEffect(() => {
    if (wallet) {
      loadMessages(); // Reload messages when wallet connects
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
        {isLoadingMessages && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="glass-card p-6 inline-block">
              <ArrowClockwise className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading public message history...
            </div>
          </div>
        )}
        {!isLoadingMessages && messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="glass-card p-6 inline-block">
              📢 Public Message History<br />
              All messages are visible to everyone for 24 hours!
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-bubble ${msg.status} fade-in-up in-view`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                   <p className="text-sm text-white/90 mb-2">{msg.content}</p>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <span>From: {formatAddress(msg.sender)}</span>
                     <span>•</span>
                     <span>
                       {msg.isOnChain ? 
                         formatDistanceToNow(msg.timestamp, { addSuffix: true }) :
                         msg.timestamp.toLocaleTimeString()
                       }
                     </span>
                     {msg.txHash && (
                       <>
                         <span>•</span>
                         <a
                           href={`https://testnet.monadexplorer.com/tx/${msg.txHash}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-violet-400 hover:underline"
                         >
                           📎 View TX
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
        📢 Public messages visible to everyone for 24 hours • Stored on Monad Testnet
      </div>
    </div>
  );
};