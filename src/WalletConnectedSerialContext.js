import React, { useEffect } from 'react';
import { useWallet } from './WalletContext';
import { useSerialPort } from './SerialPortContext';
import { ethers } from 'ethers';

// This component acts as a bridge between WalletContext and SerialPortContext
const WalletConnectedSerialContext = ({ children }) => {
  const { 
    account, 
    isConnected, 
    connectWallet,
    signMessage,
    isMetaMaskInstalled,
    testSignature 
  } = useWallet();
  
  const {
    deviceWallet,
    deviceConnected,
    rawData,
    setData,
    setDecryptionError,
    setDecryptionKey
  } = useSerialPort();

  // When device connects and we have data, try to get a signature for decryption
  useEffect(() => {
    const requestSignatureForDecryption = async () => {
      // Only proceed if we have a connected device, raw data, and MetaMask is available
      if (deviceConnected && rawData && rawData.length > 10 && isMetaMaskInstalled && isConnected) {
        try {
          console.log("Device is connected with data, requesting signature for decryption");
          
          // Create a message with device wallet to make signing specific to this device
          const message = `Authorize decryption of data from Smart Fidget device (${deviceWallet})`;
          console.log("Requesting signature for message:", message);
          
          // Request signature from WalletContext (which handles MetaMask interaction)
          const signature = await signMessage(message);
          
          if (signature) {
            console.log("Successfully obtained signature from MetaMask");
            
            // Convert signature to decryption key
            const sigHash = ethers.keccak256(ethers.toUtf8Bytes(signature));
            console.log("Generated key hash from signature");
            
            // Pass the key to SerialPortContext for decryption
            setDecryptionKey(sigHash);
          } else {
            console.error("Failed to get signature for decryption");
            setDecryptionError("Could not get authorization from MetaMask for decryption");
          }
        } catch (error) {
          console.error("Error requesting signature for decryption:", error);
          setDecryptionError(`Error during signature: ${error.message}`);
        }
      }
    };
    
    // Call the function
    requestSignatureForDecryption();
  }, [deviceConnected, rawData, isConnected, deviceWallet]);

  return (
    <>
      {children}
    </>
  );
};

export default WalletConnectedSerialContext;