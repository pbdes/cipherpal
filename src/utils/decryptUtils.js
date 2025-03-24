import CryptoJS from "crypto-js";

export function decryptData(encryptedHex, walletAddress) {
  try {
    console.log("Starting decryption process for data length: " + encryptedHex.length);
    // Retrieve the symmetric key saved in localStorage.
    const symmetricKey = localStorage.getItem("deviceEncryptionKey");
    if (!symmetricKey) {
      throw new Error("Symmetric key not found in localStorage");
    }
    const normalizedKey = symmetricKey.trim().toLowerCase();
    console.log("Using symmetric key:", normalizedKey.substring(0, 10) + "...");
    
    // Derive the shared AES key by concatenating the secret phrase and the symmetric key as binary.
    const secretPhraseWA = CryptoJS.enc.Utf8.parse(process.env.REACT_APP_SECRET_PHRASE);
    const symmetricKeyWA = CryptoJS.enc.Hex.parse(normalizedKey);
    const combinedWA = secretPhraseWA.concat(symmetricKeyWA);
    const aesKey = CryptoJS.SHA256(combinedWA);
    
    // Extract IV and ciphertext from the encrypted string.
    const ivHex = encryptedHex.substring(0, 32);
    const ciphertextHex = encryptedHex.substring(32);
    console.log("IV:", ivHex, "Ciphertext (first 40 chars):", ciphertextHex.substring(0, 40) + "...");
    
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex);
    
    // Decrypt using CryptoJS AES (CBC mode with PKCS7 padding)
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      aesKey,
      { iv: iv, padding: CryptoJS.pad.Pkcs7, mode: CryptoJS.mode.CBC }
    );
    
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText || decryptedText.length === 0) {
      throw new Error("Decryption result is empty");
    }
    
    console.log("Decryption successful:", decryptedText.substring(0, 50) + "...");
    
    try {
      return JSON.parse(decryptedText);
    } catch (jsonError) {
      console.error("Failed to parse decrypted text as JSON:", jsonError);
      return { rawData: decryptedText, decryptionMethod: "symmetric" };
    }
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

export function decryptDataSimplified(encryptedHex, walletAddress) {
  try {
    console.log("Using simplified decryption for length:", encryptedHex.length);
    const symmetricKey = localStorage.getItem("deviceEncryptionKey");
    if (!symmetricKey) {
      throw new Error("No symmetric key found in localStorage");
    }
    const normalizedKey = symmetricKey.trim().toLowerCase();
    console.log("Found symmetric key (first few chars):", normalizedKey.substring(0, 10) + "...");
    
    if (encryptedHex.length < 32) {
      throw new Error("Encrypted data too short to contain valid IV and ciphertext");
    }
    const ivHex = encryptedHex.substring(0, 32);
    const ciphertextHex = encryptedHex.substring(32);
    
    const secretPhraseWA = CryptoJS.enc.Utf8.parse("biotech_shared_key_");
    const symmetricKeyWA = CryptoJS.enc.Hex.parse(normalizedKey);
    const combinedWA = secretPhraseWA.concat(symmetricKeyWA);
    const aesKey = CryptoJS.SHA256(combinedWA);
    
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aesKey,
      { iv, padding: CryptoJS.pad.Pkcs7, mode: CryptoJS.mode.CBC }
    );
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (result && result.length > 0) {
      console.log("Simplified decryption successful:", result.substring(0, 30) + "...");
      if (result.startsWith('{') && result.includes('}')) {
        try {
          const parsed = JSON.parse(result);
          parsed.decryptMethod = "simplified";
          return parsed;
        } catch (e) {
          console.warn("Decryption produced text but not valid JSON:", e.message);
          return { rawData: result, decryptMethod: "simplified", partialJson: true };
        }
      }
      return { rawData: result, decryptMethod: "simplified" };
    }
    
    throw new Error("Simplified decryption failed to produce valid results");
  } catch (error) {
    console.error("Simplified decryption error:", error);
    throw new Error(`Simplified decryption failed: ${error.message}`);
  }
}

/**
 * Helper function to check if an object contains encrypted data
 * @param {Object} obj - Object to check
 * @returns {boolean} True if the object has encrypted data
 */
export function hasEncryptedData(obj) {
  return obj &&
    typeof obj === 'object' &&
    obj.encrypted === true &&
    typeof obj.data === 'string';
}