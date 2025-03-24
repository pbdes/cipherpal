import React, { useState, useEffect } from "react";
import Popup from "./Popup";

export default function Header({ deviceConnected, newDataAvailable, newRequest, connectionStatus }) {
  const [showNoDataPopup, setShowNoDataPopup] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  
  useEffect(() => {
    // If device becomes connected, record it
    if (deviceConnected) {
      setWasConnected(true);
    }
    
    // If device was connected but is now disconnected and there's no data to upload
    if (wasConnected && !deviceConnected && !newDataAvailable) {
      setShowNoDataPopup(true);
      
      // Hide the popup after 8 seconds
      const timer = setTimeout(() => {
        setShowNoDataPopup(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [deviceConnected, newDataAvailable, wasConnected]);
  
  // If connection status changes to disconnected and we were previously connected,
  // reset the wasConnected state after a delay
  useEffect(() => {
    if (connectionStatus === "disconnected" && wasConnected) {
      const timer = setTimeout(() => {
        setWasConnected(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, wasConnected]);
  
  return (
    <header className="flex justify-start content-center gap-10 pb-10 min-h-[100px]">
      <div className="w-full self-center space-y-2">
        {/* Show only one popup at a time, with priority */}
        {showNoDataPopup && <Popup reason="noData" />}
        {!showNoDataPopup && !deviceConnected && <Popup reason="preview" />}
        {!showNoDataPopup && newDataAvailable && <Popup reason="newData" />}
        {newRequest && <Popup reason="newReq" />}
      </div>
    </header>
  );
}