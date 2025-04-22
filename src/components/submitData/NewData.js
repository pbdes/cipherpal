import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CTAButton from "../ui/buttons/CTAButton";
import Session from "./Session";
import Summary from "./Summary";
import SmartFidget from "../../contracts/SmartFidget.sol/SmartFidget.json";
import { ethers } from "ethers";
import readData from "../../utils/readData";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import CryptoJS from "crypto-js";
import { decryptData, hasEncryptedData } from "../../utils/decryptUtils";

const smartFidgetAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Initialize ThirdwebStorage
const storage = new ThirdwebStorage({
  clientId: process.env.REACT_APP_THIRDWEB_CLIENT_ID,
});

async function uploadToIPFS(data) {
  try {
    const file = new File([JSON.stringify(data)], "data.json", {
      type: "application/json",
    });
    const uri = await storage.upload(file);
    console.log("Data uploaded to IPFS. URI:", uri);
    return uri; // Return the URI
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

function encryptIPFSHash(hash) {
  const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex); // Generate a random AES key
  const encrypted = CryptoJS.AES.encrypt(hash, key).toString(); // Encrypt the IPFS hash
  return { encryptedHash: encrypted, encryptionKey: key };
}

export default function NewData({ data, onDisconnectDevice, onSetNewDataAvailable }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStage, setUploadStage] = useState("idle"); // 'idle', 'ipfs', 'chain', 'complete'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [localDataId, setLocalDataId] = useState("");
  // Store all session notes in one object
  const [allSessionNotes, setAllSessionNotes] = useState({});
  const [processedData, setProcessedData] = useState({
    avgHB: 0,
    minHB: 0,
    maxHB: 0,
    main: 0, // 0 is for ccw, 1 is for cw and 2 is for p
    values: {
      p: 0,
      ccw: 0,
      cw: 0,
    },
    duration: 0,
    sessionCount: 0,
    date: "",
    combinedData: [],
  });

  // Function to update notes for a specific session
  const updateSessionNotes = (sessionId, notesData) => {
    setAllSessionNotes(prev => ({
      ...prev,
      [sessionId]: notesData
    }));
    console.log(`Notes updated for session ${sessionId}:`, notesData);
  };

  // Process the data when it changes
  useEffect(() => {
    if (data && data.length > 0) {
      try {
        console.log("Raw data from device:", data);
  
        const jsonMatch = data.match(/\{.*\}/s);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in data");
        }
  
        const jsonString = jsonMatch[0];
        console.log("Extracted JSON string:", jsonString);
  
        const parsedData = JSON.parse(jsonString);
        console.log("Parsed data:", parsedData);
  
        if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
          // The data from the SerialPortContext should already be decrypted
          // But we'll check for any encrypted entries just to be safe
          const sessions = parsedData.data.map(session => {
            if (hasEncryptedData(session)) {
              try {
                console.warn("Found encrypted session in parsed data - decrypting");
                const walletAddress = localStorage.getItem('deviceWallet');
                if (!walletAddress) {
                  throw new Error("No wallet address available for decryption");
                }
                return decryptData(session.data, walletAddress);
              } catch (err) {
                console.error("Failed to decrypt session:", err);
                return { error: "Decryption failed", originalData: session };
              }
            }
            return session;
          });
          
          console.log("Processed session data:", sessions);
  
          // Process the session data
          processSessionData(sessions);
        } else {
          console.error("Invalid data format:", parsedData);
          setError("Invalid data format received from device");
        }
      } catch (err) {
        console.error("Error processing device data:", err);
        setError("Failed to process data from device");
      }
    } else {
      // Set demo data if no real data is available
      setProcessedData({
        avgHB: 88,
        minHB: 67,
        maxHB: 109,
        main: 0,
        values: {
          p: 10,
          ccw: 55,
          cw: 30,
        },
        duration: 16,
        sessionCount: 3,
        date: "24.2.25",
        combinedData: [
          {
            id: 0,
            min: 67,
            max: 90,
            avg: 78,
            duration: 300000,
            startTime: "10:30",
            endTime: "10:35",
            p: 3,
            ccw: 15,
            cw: 8,
          },
          {
            id: 1,
            min: 70,
            max: 95,
            avg: 82,
            duration: 400000,
            startTime: "14:15",
            endTime: "14:22",
            p: 4,
            ccw: 20,
            cw: 12,
          },
          {
            id: 2,
            min: 72,
            max: 109,
            avg: 88,
            duration: 260000,
            startTime: "18:45",
            endTime: "18:49",
            p: 3,
            ccw: 20,
            cw: 10,
          },
        ],
      });
    }
  }, [data]);

  function processSessionData(sessions) {
    try {
      // Filter out any sessions with errors (failed decryption)
      const validSessions = sessions.filter(session => !session.error);
      
      if (validSessions.length === 0) {
        setError("No valid sessions found. Decryption may have failed.");
        return;
      }
      
      // Initialize values
      let sum = 0;
      let minValue = validSessions[0]?.min || 0;
      let maxValue = validSessions[0]?.max || 0;
      let totalDuration = 0;
      let pCount = 0;
      let ccwCount = 0;
      let cwCount = 0;

      // Process each session
      for (let i = 0; i < validSessions.length; i++) {
        const session = validSessions[i];

        // Ensure each session has the expected fields
        if (!session.startTime) session.startTime = "";
        if (!session.endTime) session.endTime = "";

        // Accumulate values
        pCount += session.p || 0;
        ccwCount += session.ccw || 0;
        cwCount += session.cw || 0;

        // Add duration (in milliseconds)
        totalDuration += session.duration || 0;

        // Track min/max heart rates
        if (session.min && (session.min < minValue || minValue === 0)) {
          minValue = session.min;
        }
        if (session.max && session.max > maxValue) {
          maxValue = session.max;
        }

        // Add to average calculation
        sum += session.avg || 0;

        // Make sure session has an ID
        if (session.id === undefined) {
          session.id = i;
        }
      }

      // Calculate average
      const avgValue = validSessions.length > 0 ? sum / validSessions.length : 0;

      // Convert duration to minutes for the daily total
      const durationInMinutes = Math.round(totalDuration / 60000);

      // Determine main activity (0 for ccw, 1 for cw, 2 for p)
      let mainActivity = 0; // Default to ccw
      if (cwCount > ccwCount && cwCount > pCount) {
        mainActivity = 1; // cw
      } else if (pCount > ccwCount && pCount > cwCount) {
        mainActivity = 2; // p
      }

      // Get the date from the second session IMPORTANT: IT IS A TEMPORARY FIX RELATED TO THE BUG ON THE DEVICE
      const now = new Date();
    
      // Format: YYYY-MM-DD HH:MM:SS
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      let date;

      if (validSessions[0].date === "14.4.25") {
        if(validSessions[1].date) {
          if (validSessions[1].date === "14.4.25") {
            date = `${day}.${month}.${year}`;
          } else {
            date = validSessions[1].date;
          }
        }
      } else {
        date = validSessions[0].date;
      }

      // Update state with processed data
      setProcessedData({
        avgHB: Math.round(avgValue),
        minHB: minValue,
        maxHB: maxValue,
        main: mainActivity,
        values: {
          p: pCount,
          ccw: ccwCount,
          cw: cwCount,
        },
        duration: durationInMinutes,
        sessionCount: validSessions.length,
        date: date,
        combinedData: validSessions,
      });

      console.log("Data processed successfully:", {
        avgHB: Math.round(avgValue),
        minHB: minValue,
        maxHB: maxValue,
        main: mainActivity,
        duration: durationInMinutes,
        sessionCount: validSessions.length,
        date: date,
      });
    } catch (err) {
      console.error("Error in processSessionData:", err);
      setError("Failed to process session data");
    }
  }

  async function requestAccount() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      return true;
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.");
      return false;
    }
  }

  // Prepare data with notes and tags for upload
  const prepareDataForUpload = () => {
    return processedData.combinedData.map(session => {
      const sessionNotes = allSessionNotes[session.id] || {};
      
      // Format tags similar to the original Session.js
      let tagsArray = [];
      if (sessionNotes.mood) {
        tagsArray = tagsArray.concat(sessionNotes.mood);
      }
      if (sessionNotes.activity) {
        tagsArray = tagsArray.concat(sessionNotes.activity);
      }
      
      // Get comment from notes if available
      const comment = sessionNotes.comment || "";
      
      return {
        ...session,
        tags: tagsArray,
        tagsString: tagsArray.join(';'),
        notes: comment
      };
    });
  };

  async function handleUploadClick() {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setLocalDataId("");
    setUploadStage("ipfs");
  
    try {
      // Prepare data with notes and tags
      const sessionsWithMetadata = prepareDataForUpload();
      console.log("Sessions with metadata:", sessionsWithMetadata);
  
      // Create final data object for upload
      const finalData = {
        ...processedData,
        combinedData: sessionsWithMetadata
      };
  
      console.log("Final data for upload:", finalData);
  
      // Upload data to IPFS
      console.log("Uploading data to IPFS...");
      const cid = await uploadToIPFS(finalData);
      console.log("Data uploaded to IPFS. CID:", cid);
  
      // Update UI to indicate IPFS upload is complete
      setUploadStage("encrypt");
  
      // Encrypt IPFS hash
      const { encryptedHash, encryptionKey } = encryptIPFSHash(cid);
  
      // Update UI to indicate encryption is complete
      setUploadStage("chain");
  
      // Connect to blockchain
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask not installed");
      }
  
      const accountConnected = await requestAccount();
      if (!accountConnected) {
        setIsLoading(false);
        setUploadStage("idle");
        return;
      }
  
      // Get signer and contract
      let provider = new ethers.BrowserProvider(window.ethereum);
      let signer = await provider.getSigner();
      console.log("Connected account:", await signer.getAddress());
  
      const contract = new ethers.Contract(
        smartFidgetAddress,
        SmartFidget.abi,
        signer
      );
  
      // Store the encrypted IPFS hash and encryption key on-chain
      console.log(
        `Storing reference on blockchain: Date=${processedData.date}, EncryptedHash=${encryptedHash}, EncryptionKey=${encryptionKey}`
      );
      const tx = await contract.addRecord(
        processedData.date,
        encryptedHash,
        encryptionKey
      );
  
      console.log("Transaction sent:", tx.hash);
  
      // Update UI to indicate the transaction is pending
      setUploadStage("pending");
  
      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
  
      // Update UI to indicate the upload is complete
      setUploadStage("complete");
      setSuccess(true);
      setIsLoading(false);
  
      // Refresh data in the background
      await readData();
  
      // Disconnect device and clear data availability flag
      onDisconnectDevice();
      onSetNewDataAvailable(false);
  
      // Navigate to records page after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Upload failed:", err); // ✅ Logs full error in console for debugging
  
      // Extract the main error reason for UI
      let errorMessage = "Upload failed: Unknown error";
  
      if (err.reason) {
        errorMessage = `Upload failed: ${err.reason}`;
      } else if (err.code === "ACTION_REJECTED") {
        errorMessage = "Upload failed: User rejected the transaction.";
      } else if (err.message) {
        errorMessage = `Upload failed: ${err.message.split(":")[1]?.trim() || err.message}`;
      }
  
      setError(errorMessage);
      setIsLoading(false);
      setUploadStage("idle");
    }
  }

  // Calculate the highest value among `cw`, `ccw`, and `p` across all sessions
  const getDominantValue = (sessions) => {
    let cwTotal = 0;
    let ccwTotal = 0;
    let pTotal = 0;

    sessions.forEach(session => {
        cwTotal += session.cw || 0;
        ccwTotal += session.ccw || 0;
        pTotal += session.p || 0;
    });

    // Determine the dominant type
    if (cwTotal >= ccwTotal && cwTotal >= pTotal) return "cw";
    if (ccwTotal >= cwTotal && ccwTotal >= pTotal) return "ccw";
    return "p"; // If `p` is the highest
  };

  const dominantType = getDominantValue(processedData.combinedData);

  // Helper function to get upload stage text
  const getUploadStageText = () => {
    switch (uploadStage) {
      case "ipfs":
        return "Storing data on IPFS...";
      case "encrypt":
        return "Encrypting data...";
      case "chain":
        return "Storing reference on blockchain...";
      case "pending":
        return "Waiting for confirmation...";
      case "complete":
        return "Preparing to redirect...";
      default:
        return "Upload";
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-10 gradient-stroke max-h-full overflow-hidden">
      <div className="content flex-1 w-full pl-8 pr-4 py-5 flex-1 overflow-hidden">
        <div className="max-h-full pr-3 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="rounded-2xl my-5 bg-[#140A27] border border-[#BA162A] text-[#E83148] py-4 px-6">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {success && (
            <div className="bg-[#0A1C26] border border-[#51CA22] text-[#51CA22] px-6 py-4 rounded-2xl relative mb-4">
              <strong className="font-bold">Success! </strong>
              <span className="block sm:inline">
                Data uploaded successfully!
                {localDataId && (
                  <div className="mt-2">
                    <span className="font-semibold">Data ID:</span>
                    <code className="bg-green-50 px-2 py-1 rounded mx-1">
                      {localDataId}
                    </code>
                  </div>
                )}
                <div className="mt-1">Redirecting to your dashboard...</div>
              </span>
            </div>
          )}

          <Summary
            len={processedData.sessionCount}
            date={processedData.date}
            avg={processedData.avgHB}
            max={processedData.maxHB}
            min={processedData.minHB}
            duration={processedData.duration}
            form={true}
            dominantType={dominantType}
          />

          <div>
            {processedData.combinedData && processedData.combinedData.length > 0 ? (
              processedData.combinedData.map((session, index) => (
                <Session 
                  key={index}
                  session={session} 
                  tot={processedData.sessionCount}
                  onNotesUpdate={(notesData) => updateSessionNotes(session.id, notesData)}
                />
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">No session data available</div>
            )}
          </div>

          <div className="text-center">
            {isLoading ? (
              <button
                className="w-full py-2 px-4 flex items-center justify-center gap-4 bg-[#113766] text-white font-bold rounded-3xl cursor-not-allowed opacity-70"
                disabled
              >
                {getUploadStageText()}
              </button>
            ) : success ? (
              <button
                className="w-full py-2 px-4 flex items-center justify-center gap-4 bg-[#113766] text-white font-bold rounded-3xl cursor-not-allowed opacity-70"
                disabled
              >
                Redirecting to Dashboard...
              </button>
            ) : (
              <div onClick={handleUploadClick}>
                <CTAButton text="Upload" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}