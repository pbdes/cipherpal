import { ethers } from "ethers";
import SmartFidget from "../contracts/SmartFidget.sol/SmartFidget.json";
import { ThirdwebStorage } from "@thirdweb-dev/storage"; // Import ThirdwebStorage
import CryptoJS from "crypto-js"; // For decryption

const smartFidgetAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Initialize ThirdwebStorage
const storage = new ThirdwebStorage({
  clientId: process.env.REACT_APP_THIRDWEB_CLIENT_ID,
});

/**
 * Fetch data from the Smart Fidget contract and IPFS
 * @returns {Promise<Array>} Array of record data
 */
export default async function readData() {
  // Check if ethereum is available
  if (typeof window.ethereum === "undefined") {
    console.log("MetaMask not installed or not accessible");
    return [];
  }

  try {
    // Set up provider
    let provider;
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error("Error creating provider:", error);
      return [];
    }

    // Get signer
    let signer;
    try {
      signer = await provider.getSigner();
    } catch (error) {
      console.error("Error getting signer:", error);
      return [];
    }

    // Create contract instance
    const contract = new ethers.Contract(
      smartFidgetAddress,
      SmartFidget.abi,
      signer
    );

    // Get user's address
    const userAddress = await signer.getAddress();

    // Get all dates for the user
    const dates = await contract.getMyDates();

    if (!dates || dates.length === 0) {
      console.log("No records found");
      return [];
    }

    console.log(`Found ${dates.length} dates with records`);

    // Process each date to get IPFS hash and fetch data
    const records = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];

      // Get IPFS hash and encryption key from the contract
      const ipfsHash = await contract.getMyIPFSHash(date);
      const encryptionKey = await contract.getMyEncryptionKey(date);

      console.log(`Date: ${date}, IPFS Hash: ${ipfsHash}`);

      if (ipfsHash && encryptionKey) {
        try {
          // Step 1: Decrypt the IPFS hash using the encryption key
          const decryptedIPFSHash = CryptoJS.AES.decrypt(
            ipfsHash,
            encryptionKey
          ).toString(CryptoJS.enc.Utf8);

          // Step 2: Fetch data from IPFS
          const data = await storage.download(decryptedIPFSHash);
          const jsonData = await data.json();

          console.log("Fetched data from IPFS:", jsonData);

          // Create a record object for UI compatibility
          const record = {
            writer: userAddress,
            date: date,
            avg: jsonData.avgHB,
            min: jsonData.minHB,
            max: jsonData.maxHB,
            main: jsonData.main,
            sessionCount: jsonData.sessionCount,
            totDuration: jsonData.duration,
            dataId: decryptedIPFSHash, // Use IPFS hash as the data ID
            sessions: jsonData.combinedData,
          };

          records.push(record);
        } catch (error) {
          console.error(`Error fetching data for date ${date}:`, error);
        }
      } else {
        console.error(`No IPFS hash or encryption key found for date ${date}`);
      }
    }

    return records;
  } catch (err) {
    console.error("Unexpected error in readData:", err);
    return [];
  }
}

/**
 * Get a human-readable description of the main activity
 * @param {number} main - Main activity code (0, 1, or 2)
 * @returns {string} Human-readable description
 */
export function getMainActivityDescription(main) {
  switch (main) {
    case 0:
      return "Counter-Clockwise";
    case 1:
      return "Clockwise";
    case 2:
      return "Press";
    default:
      return "Unknown";
  }
}