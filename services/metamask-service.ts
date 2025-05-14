/*
* This file holds all metamask handlers and logic
*
* */

import { toast } from '@/lib/toast';

interface MetaMaskState {
  isConnected: boolean;
  accounts: string[];
  chainId: string | null;
  isSupported: boolean;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

class MetaMaskService {
  private state: MetaMaskState = {
    isConnected: false,
    accounts: [],
    chainId: null,
    isSupported: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkAvailability();
      this.initializeListeners();
    }
  }

  /**
   * Check if MetaMask is available in the browser
   */
  private checkAvailability(): void {
    this.state.isSupported = typeof window !== 'undefined' && 
      window.ethereum !== undefined;
  }

  /**
   * Initialize MetaMask event listeners
   */
  private initializeListeners(): void {
    if (!this.state.isSupported) return;

    // Handle account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.state.accounts = accounts;
      this.state.isConnected = accounts.length > 0;
      
      if (accounts.length === 0) {
        // User disconnected their wallet
        toast({ title: "Wallet Disconnected", description: "Your MetaMask wallet has been disconnected" });
      } else {
        // Account switched
        toast({ title: "Account Changed", description: `Switched to ${this.formatAddress(accounts[0])}` });
      }
    });

    // Handle chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      this.state.chainId = chainId;
      toast({ title: "Network Changed", description: "The blockchain network has been changed" });
      window.location.reload();
    });

    // Handle connection
    window.ethereum.on('connect', ({ chainId }: { chainId: string }) => {
      this.state.chainId = chainId;
    });

    // Handle disconnection
    window.ethereum.on('disconnect', () => {
      this.state.isConnected = false;
      this.state.accounts = [];
      this.state.chainId = null;
    });
  }

  /**
   * Format an Ethereum address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return this.state.isSupported;
  }

  /**
   * Get the connected account
   */
  getAccount(): string | null {
    return this.state.accounts.length > 0 ? this.state.accounts[0] : null;
  }

  /**
   * Get all connected accounts
   */
  getAccounts(): string[] {
    return this.state.accounts;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get the current chain ID
   */
  getChainId(): string | null {
    return this.state.chainId;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connect(): Promise<string | null> {
    if (!this.state.isSupported) {
      toast({ 
        title: "MetaMask Not Installed", 
        description: "Please install MetaMask to use blockchain features", 
        variant: "destructive" 
      });
      
      // Open MetaMask website in a new tab
      window.open('https://metamask.io/download.html', '_blank');
      return null;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.state.accounts = accounts;
      this.state.isConnected = accounts.length > 0;
      
      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.state.chainId = chainId;

      if (accounts.length > 0) {
        toast({ 
          title: "Wallet Connected", 
          description: `Connected to ${this.formatAddress(accounts[0])}` 
        });
        return accounts[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      
      // Handle user rejected request error
      if (error.code === 4001) {
        toast({ 
          title: "Connection Rejected", 
          description: "You rejected the connection request", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Connection Error", 
          description: error.message || "Failed to connect to MetaMask", 
          variant: "destructive" 
        });
      }
      
      return null;
    }
  }

  /**
   * Disconnect from MetaMask (this is a client-side disconnect only)
   */
  disconnect(): void {
    this.state.isConnected = false;
    this.state.accounts = [];
    toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected" });
  }

  /**
   * Get the current network name based on chain ID
   */
  getNetworkName(): string {
    if (!this.state.chainId) return 'Not Connected';
    
    const chainId = parseInt(this.state.chainId, 16);
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Mumbai Testnet';
      case 1337: return 'Local Network';
      default: return `Unknown Network (${chainId})`;
    }
  }

  /**
   * Switch to a specific Ethereum chain
   */
  async switchChain(chainId: string): Promise<boolean> {
    if (!this.state.isSupported) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (error: any) {
      console.error('Error switching chain:', error);
      
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        toast({ 
          title: "Network Not Available", 
          description: "This network needs to be added to your MetaMask", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Network Switch Failed", 
          description: error.message || "Failed to switch network", 
          variant: "destructive" 
        });
      }
      
      return false;
    }
  }
}

export const metamaskService = new MetaMaskService();
export default metamaskService;