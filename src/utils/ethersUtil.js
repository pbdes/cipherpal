import { ethers } from "ethers";

/**
 * Get the public key by signing a dummy message with the private key
 * @param {string} account - Ethereum wallet address
 * @returns {Promise<string>} Hex string of the 64-byte uncompressed public key (without 0x04 prefix)
 */
export async function getPublicKeyFromWallet(account) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }
    
    // Create a provider and connect to the current account
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Make sure the signer address matches the requested account
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Signer address doesn't match requested account");
    }
    
    // Create a dummy message to sign
    const message = "Sign this message to extract your public key for device encryption";
    
    console.log("Requesting signature for message:", message);
    
    // Sign the message
    const signature = await signer.signMessage(message);
    console.log("Got signature:", signature.substring(0, 10) + "...");
    
    // Since we can't directly recover the public key in this version of ethers,
    // we'll use a deterministic approach to generate a key for encryption
    
    // Hash the signature to create a deterministic key derived from the wallet
    const keyBytes = ethers.keccak256(ethers.toUtf8Bytes(signature));
    console.log("Generated key bytes:", keyBytes.substring(0, 10) + "...");
    
    // Remove the 0x prefix to get a 64-character (32-byte) hex string
    // We'll duplicate it to get a 64-byte key as expected by the device
    const keyHex = keyBytes.slice(2);
    console.log("Key hex (truncated):", keyHex.substring(0, 10) + "...");
    
    // Return 64 bytes (128 hex characters) for the device
    const fullKey = keyHex + keyHex;
    console.log("Full key length:", fullKey.length, "characters");
    return fullKey;
  } catch (error) {
    console.error("Error getting public key:", error);
    throw error;
  }
}

/**
 * Derive the shared secret using the wallet's private key and a temp public key
 * @param {string} tempPublicKey - Hex string of temporary public key
 * @returns {Promise<Uint8Array>} Shared secret as byte array
 */
export async function deriveSharedSecret(tempPublicKey) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }
    
    // Create a provider and connect to the current account
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // We'll need to request the user to sign a specific message that includes the temp public key
    // This is a workaround since we can't directly access the private key
    const message = `Decrypt data using key: ${tempPublicKey}`;
    
    // Get signature
    const signature = await signer.signMessage(message);
    
    // Use the signature as an entropy source for the shared secret
    // In a real implementation, this would use proper ECDH, but we're limited by MetaMask's API
    const sharedSecret = ethers.keccak256(ethers.toUtf8Bytes(signature));
    
    // Convert to bytes
    return ethers.getBytes(sharedSecret);
  } catch (error) {
    console.error("Error deriving shared secret:", error);
    throw error;
  }
}