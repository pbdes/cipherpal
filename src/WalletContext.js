import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

// Create the context
const WalletContext = createContext();

// Network configuration - Polygon zkEVM Cardona
const NETWORK_CONFIG = {
    chainId: '0x98a',
    chainName: 'Polygon zkEVM Cardona Testnet',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://rpc.cardona.zkevm-rpc.com'],
    blockExplorerUrls: ['https://cardona-zkevm.polygonscan.com/']
};

export const WalletProvider = ({ children }) => {
    const navigate = useNavigate();
    
    // State
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    
    // Computed states
    const isConnected = Boolean(account);
    const isCorrectNetwork = chainId === NETWORK_CONFIG.chainId;
    
    // Handle account changes
    const handleAccountsChanged = (accounts) => {
        console.log("Accounts changed:", accounts);
        if (!accounts || accounts.length === 0) {
            setAccount(null);
            setSigner(null);
        } else {
            setAccount(accounts[0]);
            // Update signer when account changes
            updateSignerWithCurrentProvider();
        }
    };
    
    // Handle chain changes
    const handleChainChanged = (newChainId) => {
        console.log("Chain changed:", newChainId);
        setChainId(newChainId);
        // Update signer when chain changes
        updateSignerWithCurrentProvider();
    };
    
    // Helper function to update signer with current provider
    const updateSignerWithCurrentProvider = async () => {
        if (window.ethereum && isMetaMaskInstalled) {
            try {
                const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(ethersProvider);
                
                // Only get signer if we have an account
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    const ethersSigner = await ethersProvider.getSigner();
                    setSigner(ethersSigner);
                    console.log("Signer updated with address:", await ethersSigner.getAddress());
                } else {
                    setSigner(null);
                    console.log("No accounts available, signer set to null");
                }
            } catch (error) {
                console.error("Error updating signer:", error);
                setSigner(null);
            }
        }
    };
    
    // Check for MetaMask on mount
    useEffect(() => {
        const checkForMetaMask = async () => {
            console.log("Checking for MetaMask...");
            setIsLoading(true);
            
            // Simple check for ethereum object
            const hasMetaMask = Boolean(window.ethereum);
            setIsMetaMaskInstalled(hasMetaMask);
            console.log("MetaMask installed:", hasMetaMask);
            
            if (hasMetaMask) {
                try {
                    // Initialize provider
                    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(ethersProvider);
                    
                    // Set up event listeners first
                    window.ethereum.on('accountsChanged', handleAccountsChanged);
                    window.ethereum.on('chainChanged', handleChainChanged);
                    
                    // Get accounts - this won't prompt if MetaMask is already connected
                    const accounts = await window.ethereum.request({ 
                        method: 'eth_accounts'
                    });
                    
                    if (accounts && accounts.length > 0) {
                        console.log("Already connected to account:", accounts[0]);
                        setAccount(accounts[0]);
                        
                        // Get signer if account is available
                        try {
                            const ethersSigner = await ethersProvider.getSigner();
                            setSigner(ethersSigner);
                            console.log("Signer initialized with address:", await ethersSigner.getAddress());
                        } catch (signerError) {
                            console.error("Error getting signer:", signerError);
                        }
                        
                        // Check chain ID if connected
                        const currentChainId = await window.ethereum.request({ 
                            method: 'eth_chainId'
                        });
                        console.log("Current chainId:", currentChainId);
                        setChainId(currentChainId);
                    } else {
                        console.log("No accounts connected");
                    }
                } catch (error) {
                    console.error("Error checking MetaMask state:", error);
                }
            }
            
            // Always set loading to false, even if there was an error
            setIsLoading(false);
        };
        
        // Run the check immediately
        checkForMetaMask();
        
        // Cleanup listeners
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);
    
    // Connect wallet function
    const connectWallet = async () => {
        console.log("Connecting wallet...");
        if (!isMetaMaskInstalled) {
            console.log("MetaMask not installed, cannot connect");
            return false;
        }
        
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts && accounts.length > 0) {
                console.log("Connected to account:", accounts[0]);
                setAccount(accounts[0]);
                
                // Get current chain ID
                const currentChainId = await window.ethereum.request({ 
                    method: 'eth_chainId' 
                });
                setChainId(currentChainId);
                
                // Update provider and signer
                await updateSignerWithCurrentProvider();
                
                return true;
            } else {
                console.log("No accounts returned after connection request");
                return false;
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            return false;
        }
    };
    
    // Switch network function
    const switchNetwork = async () => {
        console.log("Switching network...");
        if (!isMetaMaskInstalled || !isConnected) {
            console.log("Cannot switch network: MetaMask not installed or not connected");
            return false;
        }
        
        try {
            // Try to switch to network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK_CONFIG.chainId }]
            });
            
            // Verify the switch was successful
            const updatedChainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            setChainId(updatedChainId);
            
            // Update signer after network switch
            await updateSignerWithCurrentProvider();
            
            return updatedChainId === NETWORK_CONFIG.chainId;
            
        } catch (error) {
            // If network doesn't exist, add it
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [NETWORK_CONFIG]
                    });
                    
                    // Verify the addition was successful
                    const updatedChainId = await window.ethereum.request({ 
                        method: 'eth_chainId' 
                    });
                    setChainId(updatedChainId);
                    
                    // Update signer after network addition
                    await updateSignerWithCurrentProvider();
                    
                    return updatedChainId === NETWORK_CONFIG.chainId;
                    
                } catch (addError) {
                    console.error("Error adding network:", addError);
                    return false;
                }
            }
            
            console.error("Error switching network:", error);
            return false;
        }
    };
    
    // Sign message function
    const signMessage = async (message) => {
        console.log("WalletContext: Signing message...", message);
        
        if (!isMetaMaskInstalled) {
            console.error("MetaMask not installed, cannot sign message");
            return null;
        }
        
        if (!isConnected) {
            console.error("Wallet not connected, cannot sign message");
            try {
                const connected = await connectWallet();
                if (!connected) {
                    console.error("Failed to connect wallet for signing");
                    return null;
                }
            } catch (error) {
                console.error("Error connecting wallet before signing:", error);
                return null;
            }
        }
        
        // Make sure we have a signer
        if (!signer) {
            console.log("No signer available, attempting to update...");
            await updateSignerWithCurrentProvider();
            
            if (!signer) {
                console.error("Still no signer available after update");
                return null;
            }
        }
        
        try {
            console.log("Requesting signature via ethers.js signer...");
            
            // Try with ethers.js first
            try {
                // Using the signer with ethers.js
                console.log("Using ethers.js signer with address:", await signer.getAddress());
                const signature = await signer.signMessage(message);
                console.log("Signature obtained via ethers.js:", signature.substring(0, 10) + "...");
                return signature;
            } catch (ethersError) {
                console.error("Error with ethers.js signing:", ethersError);
                
                // Fall back to direct ethereum provider
                console.log("Falling back to direct provider method...");
                try {
                    const hexMessage = "0x" + Buffer.from(message).toString('hex');
                    const signature = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [hexMessage, account]
                    });
                    console.log("Signature obtained via direct provider:", signature.substring(0, 10) + "...");
                    return signature;
                } catch (directError) {
                    console.error("Error with direct provider signing:", directError);
                    throw directError; // Re-throw the error for the caller to handle
                }
            }
        } catch (error) {
            console.error("Error signing message:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    };
    
    // Sign message with UI feedback
    const signMessageWithFeedback = async (message) => {
        console.log("Requesting signature with user feedback...");
        
        // Alert user about signature request
        alert("You'll now be asked to sign a message in MetaMask. Please check for the MetaMask popup.");
        
        try {
            const signature = await signMessage(message);
            if (signature) {
                console.log("Signature successful!");
                return signature;
            } else {
                alert("Could not get signature from MetaMask. Please make sure it's unlocked and try again.");
                return null;
            }
        } catch (error) {
            console.error("Error during signature with feedback:", error);
            
            if (error.code === 4001) {
                alert("You rejected the signature request in MetaMask.");
            } else {
                alert("Error requesting signature: " + error.message);
            }
            
            return null;
        }
    };
    
    // Test signature function that can be called directly to check MetaMask
    const testSignature = async () => {
        try {
            const message = "Test message " + Date.now();
            console.log("Testing signature with message:", message);
            
            alert("You'll see a signature request from MetaMask. This is just a test.");
            
            const signature = await signMessage(message);
            if (signature) {
                console.log("Test signature successful:", signature);
                alert("Signature test successful!");
                return signature;
            } else {
                alert("Could not get test signature from MetaMask.");
                return null;
            }
        } catch (error) {
            console.error("Error during test signature:", error);
            alert("Test signature failed: " + error.message);
            return null;
        }
    };
    
    // Context value
    const value = {
        account,
        chainId,
        provider,
        signer,
        isMetaMaskInstalled,
        isConnected,
        isCorrectNetwork,
        isLoading,
        connectWallet,
        switchNetwork,
        signMessage,
        signMessageWithFeedback,
        testSignature,
        networkName: NETWORK_CONFIG.chainName
    };
    
    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);