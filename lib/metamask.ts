import { BrowserProvider, JsonRpcSigner } from 'ethers';

// Types for MetaMask provider
interface MetaMaskProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
}

// Types for wallet permissions
interface WalletPermission {
  eth_accounts: Record<string, never>;
}

// Types for wallet data
export interface WalletData {
  address: string;
  chainId: string;
  provider: BrowserProvider;
  signer: JsonRpcSigner;
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.ethereum?.isMetaMask === true;
};

// Request MetaMask permissions and get wallet data
export const requestMetaMaskPermissions = async (): Promise<WalletData> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request permissions
    await (window.ethereum as MetaMaskProvider).request({
      method: 'wallet_requestPermissions',
      params: [
        {
          eth_accounts: {},
        },
      ],
    });

    // Get the provider
    const provider = new BrowserProvider(window.ethereum as MetaMaskProvider);

    // Get the signer
    const signer = await provider.getSigner();

    // Get the address
    const address = await signer.getAddress();

    // Get the chain ID
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();

    return {
      address,
      chainId,
      provider,
      signer,
    };
  } catch (error) {
    console.error('Error requesting MetaMask permissions:', error);
    throw error;
  }
};

// Listen for account changes
export const onAccountsChanged = (callback: (accounts: string[]) => void): void => {
  if (!isMetaMaskInstalled()) return;

  const handler = (accounts: string[]) => {
    callback(accounts);
  };

  (window.ethereum as MetaMaskProvider).on('accountsChanged', handler);
};

// Listen for chain changes
export const onChainChanged = (callback: (chainId: string) => void): void => {
  if (!isMetaMaskInstalled()) return;

  const handler = (chainId: string) => {
    callback(chainId);
  };

  (window.ethereum as MetaMaskProvider).on('chainChanged', handler);
};

// Remove event listeners
export const removeMetaMaskListeners = (): void => {
  if (!isMetaMaskInstalled()) return;

  const provider = window.ethereum as MetaMaskProvider;
  provider.removeListener('accountsChanged', () => {});
  provider.removeListener('chainChanged', () => {});
};

// Get current wallet data without requesting permissions
export const getCurrentWalletData = async (): Promise<WalletData | null> => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const provider = new BrowserProvider(window.ethereum as MetaMaskProvider);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();

    return {
      address,
      chainId,
      provider,
      signer,
    };
  } catch (error) {
    console.error('Error getting current wallet data:', error);
    return null;
  }
}; 