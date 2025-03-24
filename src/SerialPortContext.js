import React, { createContext, useContext, useState, useEffect } from 'react';
import { decryptData, hasEncryptedData, decryptDataSimplified } from './utils/decryptUtils';
// import {ethers} from 'ethers';

const SerialPortContext = createContext({});

export const useSerialPort = () => useContext(SerialPortContext);

export const SerialPortProvider = ({ children }) => {
  const [portD, setPortD] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [data, setData] = useState("");
  const [rawData, setRawData] = useState(""); // State to store raw data before decryption
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // "disconnected", "connecting", "authenticating", "connected", "wallet_mismatch", "initialized"
  const [deviceWallet, setDeviceWallet] = useState(null); // Store the wallet address from the device
  const [writerRef, setWriterRef] = useState(null); // Store a reference to the writer
  const [readerRef, setReaderRef] = useState(null); // New state to track the reader
  const [abortController, setAbortController] = useState(null); // For signaling read loop to stop
  const [decryptionError, setDecryptionError] = useState(null); // Track decryption errors
  const [hasDataToUpload, setHasDataToUpload] = useState(false); // Track if there's data to upload
  
  let port;

  // Restore device wallet from localStorage on component mount
  useEffect(() => {
    try {
      const savedDeviceWallet = localStorage.getItem('deviceWallet');
      if (savedDeviceWallet) {
        setDeviceWallet(savedDeviceWallet);
      }
    } catch (err) {
      console.error('Error restoring device wallet:', err);
    }
  }, []);

  // Save device wallet to localStorage when it changes
  useEffect(() => {
    if (deviceWallet) {
      localStorage.setItem('deviceWallet', deviceWallet);
    }
  }, [deviceWallet]);

  // Process raw data when it changes or when device wallet changes
  useEffect(() => {
    if (rawData && deviceWallet) {
      try {
        // Try to parse the JSON from the raw data
        const jsonMatch = rawData.match(/\{.*\}/s);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log("Processing received JSON data");
          let parsedData;
          try {
            parsedData = JSON.parse(jsonString);
          } catch (err) {
            console.error("Failed to parse JSON:", err);
            setDecryptionError("Invalid JSON format received from device");
            return;
          }

          // Process the data and decrypt if needed
          if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
            // Check if data array is empty
            if (parsedData.data.length === 0) {
              console.log("Device has no data to upload");
              setHasDataToUpload(false);
              
              // Auto-disconnect after a brief delay
              setTimeout(async () => {
                console.log("Auto-disconnecting device with no data");
                await disconnectDevice();
              }, 500);
              
              // Set the empty data
              setData(JSON.stringify(parsedData));
              setDecryptionError(null);
              return;
            }
            
            // If we reach here, we have data to process
            setHasDataToUpload(true);
            
            // Decrypt any encrypted entries
            const decryptedSessions = parsedData.data.map(session => {
              if (hasEncryptedData(session)) {
                try {
                  console.log("Decrypting session data...");
                  
                  // Try both methods in sequence with better error handling
                  let decryptionResult = null;
                  let errorMessage = "";
                  
                  // Try standard method first
                  try {
                    decryptionResult = decryptData(session.data, deviceWallet);
                    // Add metadata about decryption method
                    if (decryptionResult) {
                      return {
                        ...decryptionResult,
                        decryptMethod: decryptionResult.decryptMethod || "standard"
                      };
                    }
                  } catch (standardError) {
                    console.warn("Standard decryption failed, trying simplified method:", standardError.message);
                    errorMessage = standardError.message;
                    
                    // If standard method fails, try simplified method
                    try {
                      decryptionResult = decryptDataSimplified(session.data, deviceWallet);
                      if (decryptionResult) {
                        return {
                          ...decryptionResult,
                          decryptMethod: decryptionResult.decryptMethod || "simplified"
                        };
                      }
                    } catch (simplifiedError) {
                      // Both methods failed
                      console.error("Both decryption methods failed:", simplifiedError.message);
                      
                      // Attempt one last fallback - just return the partially processed raw data if possible
                      if (decryptionResult && decryptionResult.rawData) {
                        return {
                          rawData: decryptionResult.rawData,
                          decryptMethod: "partial_fallback",
                          error: `${errorMessage} | ${simplifiedError.message}`
                        };
                      }
                      
                      // If all else fails, return the error with the original data
                      return { 
                        error: `Both decryption methods failed. Standard: ${errorMessage}, Simplified: ${simplifiedError.message}`,
                        originalData: session 
                      };
                    }
                  }
                } catch (err) {
                  console.error("Failed to decrypt session:", err);
                  return { 
                    error: "Decryption failed", 
                    errorMessage: err.message,
                    originalData: session 
                  };
                }
              }
              return session; // Return unencrypted session as is
            });

            // Check if we have any successful decryptions
            const successfulDecryption = decryptedSessions.some(
              session => !session.error && !session.errorMessage
            );
            
            if (!successfulDecryption) {
              // All decryptions failed, set a general error message
              setDecryptionError("Failed to decrypt any sessions. The data format may be incompatible.");
            } else {
              // At least one succeeded, clear any error
              setDecryptionError(null);
            }

            // Update the data with decrypted sessions
            const processedData = {
              ...parsedData,
              data: decryptedSessions
            };

            // Set the processed data
            setData(JSON.stringify(processedData));
          } else {
            setData(rawData); // If not encrypted or not in expected format, use raw data
            
            // Assume there might be data if we can't determine
            setHasDataToUpload(true);
          }
        } else {
          // If no JSON found, just use the raw data
          console.log("No valid JSON found in data, using raw data");
          setData(rawData);
          
          // Assume there might be data if we can't determine
          setHasDataToUpload(true);
        }
      } catch (err) {
        console.error("Error processing data:", err);
        setDecryptionError(`Error processing data: ${err.message}`);
        setData(rawData); // Fall back to raw data on error
        
        // Assume there might be data if we can't determine
        setHasDataToUpload(true);
      }
    }
  }, [rawData, deviceWallet]);

  // Helper function to format current date and time for the device
  const getCurrentDateTime = () => {
    const now = new Date();
    
    // Format: YYYY-MM-DD HH:MM:SS
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Function to update device date and time
  const updateDeviceDateTime = async () => {
    console.log("Updating device date and time...");
    if (writerRef) {
      try {
        const dateTimeStr = getCurrentDateTime();
        const command = `T:${dateTimeStr}`;
        console.log(`Sending time update: ${command}`);
        
        const encodedCommand = new TextEncoder().encode(command);
        await writerRef.write(encodedCommand);
        
        // Wait a bit for the device to process the time update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Device date and time updated successfully");
        return true;
      } catch (err) {
        console.error("Error updating device date and time:", err);
        return false;
      }
    } else {
      console.warn("Cannot update device date and time: No writer available");
      return false;
    }
  };

  // Function to open the serial port
  const connectPort = async () => {
    setConnectionStatus("connecting");
    if ("serial" in navigator) {
      try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        // Check if port is ready for communication
        if (port.readable && port.writable) {
          setPortD(port);
          console.log("Port is fully connected and ready!");
          setConnectionStatus("authenticating");
          return port;
        } else {
          console.error('Port is opened but not ready for read/write operations.');
          setConnectionStatus("disconnected");
          setDeviceConnected(false);
          return null;
        }
      } catch (err) {
        console.error('Error opening the serial port:', err);
        setConnectionStatus("disconnected");
        setDeviceConnected(false);
        return null;
      }
    } else {
      console.error('Web Serial API not supported.');
      setConnectionStatus("disconnected");
      return null;
    }
  };

  // Generates a 64-byte key (128 hex characters)
  const generateRandomSymmetricKey = () => {
    const array = new Uint8Array(64); // 64 bytes = 128 hex characters when converted
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // This function retrieves or generates the symmetric key, saves it locally, and sends it with the "P:" prefix.
  const getAndSendSymmetricKey = async (writer, reader, controller) => {
    let symmetricKey = localStorage.getItem("deviceEncryptionKey");
    if (!symmetricKey) {
      symmetricKey = generateRandomSymmetricKey();
      localStorage.setItem("deviceEncryptionKey", symmetricKey);
    }
    console.log("Using symmetric key (first few chars):", symmetricKey.substring(0, 10) + "...");
    
    // Send the symmetric key to the device using the P: prefix.
    const keyCommand = new TextEncoder().encode("P:" + symmetricKey);
    await writer.write(keyCommand);
    
    // Wait for confirmation from the device.
    let keyResponse = "";
    let retries = 0;
    const maxRetries = 5;
    const responseTimeout = 5000;
    
    while (retries < maxRetries && !controller?.signal?.aborted) {
      try {
        console.log(`Waiting for symmetric key registration response (attempt ${retries + 1}/${maxRetries})...`);
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout waiting for key registration response")), responseTimeout)
          )
        ]);
        if (done) break;
        const newData = new TextDecoder().decode(value);
        keyResponse += newData;
        console.log("Symmetric key registration response chunk (raw):", JSON.stringify(newData));
        
        // Expect a confirmation message from the device (e.g., "SYMKEY_OK" or "OK")
        if (keyResponse.includes("SYMKEY_OK") || keyResponse.includes("OK") || keyResponse.includes("SUCCESS")) {
          console.log("Symmetric key registration successful with response: " + keyResponse);
          return true;
        }
        
        if (keyResponse.includes("Failed") || keyResponse.includes("ERROR") || keyResponse.includes("Invalid")) {
          console.error("Device rejected symmetric key with response: " + keyResponse);
          return false;
        }
        
        if (newData.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          retries++;
        }
      } catch (error) {
        console.warn(`Symmetric key registration attempt ${retries + 1} failed: ${error.message}`);
        retries++;
      }
    }
    
    if (keyResponse.length > 0 && !keyResponse.includes("Failed") && !keyResponse.includes("ERROR")) {
      console.log("Received response but no explicit confirmation. Assuming success based on: " + keyResponse);
      return true;
    }
    
    console.error("Failed to confirm symmetric key registration after multiple attempts");
    return false;
  };


  // Function to handle device connection and authentication
  const connectReadSerial = async (account) => {
    setRawData(""); // Clear previous raw data
    setData(""); // Clear previous processed data
    setDecryptionError(null); // Clear any previous errors
    setHasDataToUpload(false); // Reset data upload state

    const mainP = await connectPort();
    if (!mainP) {
      console.error("Failed to connect to port");
      return;
    }

    // Initialize an AbortController to signal when to stop reading
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const reader = mainP.readable.getReader();
      const writer = mainP.writable.getWriter();
      
      // Store writer reference for later use in disconnectDevice
      setWriterRef(writer);

      // Step 1: Send "C" command to initiate connection
      console.log("Sending connection request...");
      const connectionCommand = new TextEncoder().encode("C");
      await writer.write(connectionCommand);

      // Read device response for authentication
      let authenticated = false;
      let authResponse = "";

      // Authentication reading loop
      while (!authenticated && !controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          writer.releaseLock();
          setWriterRef(null);
          setConnectionStatus("disconnected");
          return;
        }
        const newData = new TextDecoder().decode(value);
        authResponse += newData;
        console.log("Auth response chunk:", newData);

        // Check if we received the authentication response
        if (authResponse.includes("Y:")) {
          // Device has a wallet and is sending it to us
          // Extract wallet address after the Y:
          const parts = authResponse.split("Y:");
          if (parts.length > 1) {
            const deviceAddress = parts[1].trim().split("\n")[0]; // Get first line in case there's more data
            setDeviceWallet(deviceAddress);
            console.log("Device has wallet:", deviceAddress);

            // Check if device needs a symmetric key
            if (authResponse.includes("SYMKEY:NEEDED")) {
              console.log("Device requires symmetric key");
              const keySuccess = await getAndSendSymmetricKey(writer, reader, controller);
              if (keySuccess) {
                console.log("Symmetric key registered successfully");
                await updateDeviceDateTime();
                const startCommand = new TextEncoder().encode("S");
                await writer.write(startCommand);
              } else {
                console.error("Failed to register symmetric key");
                setConnectionStatus("disconnected");
                reader.releaseLock();
                writer.releaseLock();
                setWriterRef(null);
                return;
              }
            }            
            // If device already has symmetric key or no current account
            else {
              // Compare with current wallet if account is provided
              if (account && deviceAddress.trim().toLowerCase() !== account.trim().toLowerCase()) {
                console.log(`Comparing: '${deviceAddress.trim().toLowerCase()}' with '${account.trim().toLowerCase()}'`);
                console.error("Wallet mismatch: Device wallet doesn't match current wallet");
                setConnectionStatus("wallet_mismatch");
                reader.releaseLock();
                writer.releaseLock();
                setWriterRef(null);
                return;
              }

              // If match or no account provided yet, proceed
              console.log("Device authenticated with matching wallet");
              authenticated = true;

              // Send "S" command to start data transmission
              const startCommand = new TextEncoder().encode("S");
              await writer.write(startCommand);
            }
          }
        } else if (authResponse.includes("N")) {
          // Device needs wallet address
          console.log("Device requires wallet registration");
          if (account) {
            // Send wallet address to device
            console.log("Sending wallet address:", account);
            const walletCommand = new TextEncoder().encode("W:" + account);
            await writer.write(walletCommand);
            console.log("Sent wallet address to device");

            // Wait for confirmation
            let confirmResponse = "";
            let retries = 0;
            const maxRetries = 3;

            while (retries < maxRetries && !controller.signal.aborted) {
              try {
                const { value: confirmValue, done: confirmDone } = await Promise.race([
                  reader.read(),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout waiting for device response")), 3000)
                  )
                ]);

                if (confirmDone) {
                  break;
                }

                const newConfirmData = new TextDecoder().decode(confirmValue);
                confirmResponse += newConfirmData;
                console.log("Confirm response chunk:", newConfirmData);

                // Check if device requests symmetric key
                if (confirmResponse.includes("NEED_SYMKEY")) {
                  console.log("Device requesting symmetric key after wallet registration");
                  
                  // Send the symmetric key
                  const symKeySuccess = await getAndSendSymmetricKey(writer, reader, controller);
                  
                  if (symKeySuccess) {
                    console.log("Symmetric key registration completed");
                    
                    // Update device time after successful registration
                    await updateDeviceDateTime();
                    
                    // Now the device is fully initialized
                    setConnectionStatus("initialized");
                    setDeviceConnected(true);
                    reader.releaseLock();
                    writer.releaseLock();
                    setWriterRef(null);
                    return;
                  } else {
                    console.error("Failed to register symmetric key");
                    setConnectionStatus("disconnected");
                    reader.releaseLock();
                    writer.releaseLock();
                    setWriterRef(null);
                    return;
                  }
                }
                
                // Check for other positive acknowledgment
                if (confirmResponse.includes("OK") || confirmResponse.includes("ok") ||
                    confirmResponse.includes("ACK") || confirmResponse.includes("SAVED") ||
                    confirmResponse.includes("SUCCESS")) {
                  console.log("Wallet registered successfully");
                  setDeviceWallet(account);
                  
                  // Wait for possible NEED_SYMKEY message
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // If we don't get a NEED_SYMKEY, continue with normal flow
                  if (!confirmResponse.includes("NEED_SYMKEY")) {
                    // Update device time after wallet registration
                    await updateDeviceDateTime();
                    
                    // Now the device is initialized, mark this status
                    setConnectionStatus("initialized");
                    
                    // Release locks but keep connection active
                    reader.releaseLock();
                    writer.releaseLock();
                    setWriterRef(null);
                    console.log("Device registered and ready for independent use.");
                    setDeviceConnected(true);
                    return;
                  }
                }

                // If we got a response but no positive acknowledgment yet, wait a bit more
                if (newConfirmData.length > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                  retries++;
                }
              } catch (error) {
                console.warn(`Attempt ${retries + 1} failed: ${error.message}`);
                retries++;
                
                // If we've hit max retries but got some response, assume it worked
                if (retries >= maxRetries && confirmResponse.length > 0) {
                  console.log("Assuming wallet registration was successful despite no explicit confirmation");
                  setDeviceWallet(account);
                  
                  // Try to update device time
                  await updateDeviceDateTime();
                  
                  setConnectionStatus("initialized");
                  setDeviceConnected(true);
                  reader.releaseLock();
                  writer.releaseLock();
                  setWriterRef(null);
                  return;
                }
              }
            }

            // If we get here, we didn't get proper confirmation
            console.error("Failed to register wallet - no clear confirmation received");
            console.log("Last response received:", confirmResponse);
            reader.releaseLock();
            writer.releaseLock();
            setWriterRef(null);
            setConnectionStatus("disconnected");
            return;
          } else {
            console.error("No wallet connected, cannot authenticate device");
            reader.releaseLock();
            writer.releaseLock();
            setWriterRef(null);
            setConnectionStatus("disconnected");
            return;
          }
        }
      }

      // If we reach here, we're authenticated
      setConnectionStatus("connected");
      setDeviceConnected(true);

      // Now begin normal data reading with abort signal handling
      reader.releaseLock();
      const dataReader = mainP.readable.getReader();
      setReaderRef(dataReader); // Store reader reference

      try {
        let dataString = "";
        
        // Check the abort signal in the loop
        while (!controller.signal.aborted) {
          const { value, done } = await dataReader.read();
          if (done) {
            break;
          }
          const newChunk = new TextDecoder().decode(value);
          dataString += newChunk;
          setRawData(dataString); // Store raw data before decryption
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Reading aborted by disconnect');
        } else {
          console.error('Error reading data from the serial port:', err);
        }
      } finally {
        if (dataReader) {
          try {
            dataReader.releaseLock();
          } catch (e) {
            console.warn('Error releasing data reader lock:', e);
          }
        }
        setReaderRef(null);
      }
    } catch (err) {
      console.error('Error with serial port communication:', err);
      setConnectionStatus("disconnected");
      setDeviceConnected(false);
    }
  };

  // Function to send a command to the device (no need to create a new writer)
  const sendCommand = async (command) => {
    console.log(`Sending command: ${command}`);
    if (writerRef) {
      try {
        // Use the existing writer
        const encodedCommand = new TextEncoder().encode(command);
        await writerRef.write(encodedCommand);
        console.log(`Command '${command}' sent successfully`);
        // Don't release the lock here as this might be an ongoing connection
        return true;
      } catch (err) {
        console.error(`Error sending command '${command}':`, err);
        return false;
      }
    } else if (portD && portD.writable && !portD.writable.locked) {
      try {
        // Create a new writer if needed
        const writer = portD.writable.getWriter();
        const encodedCommand = new TextEncoder().encode(command);
        await writer.write(encodedCommand);
        writer.releaseLock(); // This correctly releases the lock
        console.log(`Command '${command}' sent successfully`);
        return true;
      } catch (err) {
        console.error(`Error sending command '${command}':`, err);
        return false;
      }
    } else {
      console.warn("Cannot send command: No writer available or stream is locked");
      return false;
    }
  };

  // Function to disconnect the device
  const disconnectDevice = async () => {
    console.log("Disconnecting device...");
    
    // First, update device date and time if possible
    if (writerRef) {
      try {
        await updateDeviceDateTime();
        
        // Add a longer wait after time update to ensure it's processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now send the disconnect command as a separate operation
        console.log("Sending 'D' disconnect command to device");
        const disconnectCommand = new TextEncoder().encode("D\n"); // Add newline for better parsing
        await writerRef.write(disconnectCommand);
        
        // Wait longer to ensure the device processes the command
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Disconnect command sent and processed");
      } catch (error) {
        console.warn("Error during pre-disconnect operations:", error);
      }
    } else {
      console.warn("No writer available, attempting fallback disconnect method");
      // Try the regular sendCommand method as fallback
      const sentCommand = await sendCommand("D\n"); // Add newline
      if (sentCommand) {
        console.log("Sent 'D' disconnect command via fallback method");
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn("Could not send disconnect command to device");
      }
    }
    
    // Only now signal the read loop to stop
    if (abortController) {
      try {
        abortController.abort();
        console.log("Aborted reading operation");
      } catch (error) {
        console.warn("Error aborting read operations:", error);
      }
      setAbortController(null);
    }
    
    // Wait before releasing locks
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Release the reader lock if necessary
    if (readerRef) {
      try {
        readerRef.releaseLock();
        console.log("Reader lock released");
      } catch (error) {
        console.warn("Error releasing reader lock:", error);
      }
      setReaderRef(null);
    }
    
    // Release the writer lock if necessary
    if (writerRef) {
      try {
        writerRef.releaseLock();
        console.log("Writer lock released");
      } catch (error) {
        console.warn("Error releasing writer lock:", error);
      }
      setWriterRef(null);
    }
    
    // Allow time for locks to be released
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force all streams to unlock
    await forceUnlockStreams();
    
    // Clean up port
    await closePort();
    
    // Update state
    setDeviceConnected(false);
    setConnectionStatus("disconnected");
    setRawData("");
    setData("");
    setHasDataToUpload(false);
    console.log("Device disconnection complete");
  };

  // Helper function to forcefully unlock streams
  const forceUnlockStreams = async () => {
    if (!portD) return;
    console.log("Attempting to force unlock streams...");
    
    // Try to forcefully cancel and recreate streams
    if (portD.readable && portD.readable.locked) {
      try {
        // This is a hack to force unlock a stream
        const tempReader = portD.readable.getReader();
        tempReader.cancel().catch(e => console.warn("Error canceling reader:", e));
        tempReader.releaseLock();
      } catch (error) {
        console.warn("Could not force unlock readable stream:", error);
      }
    }
    
    if (portD.writable && portD.writable.locked) {
      try {
        // This is a hack to force unlock a stream
        const tempWriter = portD.writable.getWriter();
        tempWriter.abort().catch(e => console.warn("Error aborting writer:", e));
        tempWriter.releaseLock();
      } catch (error) {
        console.warn("Could not force unlock writable stream:", error);
      }
    }
  };

  // Function to reset the device connection completely
  const resetDeviceConnection = () => {
    // Signal any read operations to stop
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setDeviceConnected(false);
    setConnectionStatus("disconnected");
    setDeviceWallet(null);
    setRawData("");
    setData("");
    setWriterRef(null);
    setReaderRef(null);
    setDecryptionError(null);
    setHasDataToUpload(false);
    // Clear localStorage
    localStorage.removeItem('deviceWallet');
  };

  // Helper function to close the port
  async function closePort() {
    if (portD) {
      try {
        // Check for locked streams
        const readableLocked = portD.readable && portD.readable.locked;
        const writableLocked = portD.writable && portD.writable.locked;
        
        if (readableLocked || writableLocked) {
          console.warn(`Cannot close port: ${readableLocked ? 'readable' : ''} ${writableLocked ? 'writable' : ''} stream still locked`);
          // Wait longer for locks to be released
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check again after waiting
          const stillReadableLocked = portD.readable && portD.readable.locked;
          const stillWritableLocked = portD.writable && portD.writable.locked;
          
          if (stillReadableLocked || stillWritableLocked) {
            console.error("Streams still locked after waiting, cannot close port properly");
            // Set port to null anyway to update state
            setPortD(null);
            return;
          }
        }
        
        // Now attempt to close the port
        await portD.close();
        console.log("Port closed successfully");
      } catch (err) {
        console.error('Error closing port:', err);
      } finally {
        // Always set portD to null regardless of success
        setPortD(null);
      }
    }
  }

  const closePortAfterInit = async () => {
    console.log("Closing port after initialization...");
    
    // Update device time before closing
    if (writerRef) {
      await updateDeviceDateTime();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Release locks
    if (readerRef) {
      try {
        readerRef.releaseLock();
        console.log("Reader lock released after init");
      } catch (error) {
        console.warn("Error releasing reader lock:", error);
      }
      setReaderRef(null);
    }
    
    if (writerRef) {
      try {
        // Note: NOT sending "D" command here
        writerRef.releaseLock();
        console.log("Writer lock released after init");
      } catch (error) {
        console.warn("Error releasing writer:", error);
      }
      setWriterRef(null);
    }
    
    // Close the port
    if (portD) {
      try {
        await portD.close();
        console.log("Port closed successfully after initialization");
      } catch (err) {
        console.error('Error closing port:', err);
      } finally {
        setPortD(null);
      }
    }
  };

  return (
    <SerialPortContext.Provider
      value={{
        connectPort,
        connectReadSerial,
        sendCommand,
        disconnectDevice,
        resetDeviceConnection,
        closePortAfterInit,
        deviceConnected,
        connectionStatus,
        deviceWallet,
        data,
        rawData,
        decryptionError,
        updateDeviceDateTime,
        hasDataToUpload
      }}
    >
      {children}
    </SerialPortContext.Provider>
  );
};