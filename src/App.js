import React, { useState, useEffect } from "react";
import Calendar from "./components/calendar/Calendar";
import NewData from "./components/submitData/NewData";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import DeviceConnect from "./components/device/DeviceConnect";
import Header from "./components/ui/Header";
import LeftBlock from "./components/ui/LeftBlock";
import SharedAccess from "./components/shared/SharedAccess";
import { SerialPortProvider, useSerialPort } from "./SerialPortContext";
import { WalletProvider, useWallet } from "./WalletContext";
import WalletConnect from "./components/wallet/WalletConnect";
import About from "./components/about/About";
import './App.css';



function AppContent() {
  const [newDataAvailable, setNewDataAvailable] = useState(true);
  const [newRequest, setNewRequest] = useState(false);
  const { 
    connectReadSerial, 
    disconnectDevice, 
    data, 
    deviceConnected, 
    connectionStatus,
    hasDataToUpload 
  } = useSerialPort();
  const { 
    // isMetaMaskInstalled, 
    isConnected, 
    isCorrectNetwork, 
    isLoading, 
    account 
  } = useWallet();

  // Update newDataAvailable based on hasDataToUpload
  useEffect(() => {
    setNewDataAvailable(hasDataToUpload);
  }, [hasDataToUpload]);

  // Set up timer for random new request appearance
  useEffect(() => {
    // Only set the timer if the user is logged in and connected
    if (isConnected && account) {
      // Generate random time between 0-1 minute (0-60000 ms)
      const randomTime = Math.floor(Math.random() * 60000);
      
      console.log(`New request will appear in ${randomTime/1000} seconds`);
      
      const timer = setTimeout(() => {
        setNewRequest(true);
        console.log("New access request has arrived!");
      }, randomTime);
      
      // Clean up timer on component unmount
      return () => clearTimeout(timer);
    }
  }, [isConnected, account]);

  // Connect serial when wallet changes
  useEffect(() => {
    // If wallet is connected and there is an account, but device not yet connected
    if (isConnected && account && !deviceConnected && connectionStatus === "disconnected") {
      console.log("Wallet connected, device can be connected with account:", account);
    }
  }, [isConnected, account, deviceConnected, connectionStatus, connectReadSerial]);

  // Display loading state while checking wallet status
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>Loading wallet status...</p>
      </div>
    );
  }


  // If not on connect page, check wallet connection
  const currentPath = window.location.pathname;
  if (currentPath !== '/connect' && (!isConnected || !isCorrectNetwork)) {
    return <Navigate to="/connect" />;
  }

  return (
    <div className="bg-[#000220] w-full h-screen text-white">
      <Routes>
        <Route path="/connect" element={<WalletConnect />} />
        <Route
          path="/"
          element={
            <DeviceConnect
              onDeviceConnected={deviceConnected}
              onConnectSerial={() => connectReadSerial(account)}
              connectionStatus={connectionStatus}
              walletAddress={account}
              hasDataToUpload={hasDataToUpload}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <div className="w-full flex justify-start flex-1">
                <LeftBlock 
                  deviceConnected={deviceConnected}
                  onNewDataAvailable={newDataAvailable} 
                  address={"/dashboard"} 
                  onDisconnectDevice={disconnectDevice}
                />
                <div className="w-full p-8 h-dvh flex flex-col">
                  <Header
                    deviceConnected={deviceConnected}
                    newDataAvailable={newDataAvailable}
                    newRequest={newRequest}
                    connectionStatus={connectionStatus}
                  />
                  <Calendar />
                </div>
              </div>
            </>
          }
        />
        <Route
          path="/addData"
          element={
            <>
              <div className="w-full flex justify-start">
                <LeftBlock 
                  deviceConnected={deviceConnected}
                  onNewDataAvailable={newDataAvailable} 
                  address={"/dashboard"} 
                  onDisconnectDevice={disconnectDevice}
                />
                <div className="w-full p-8 h-dvh flex flex-col flex-1">
                  <Header 
                    deviceConnected={deviceConnected} 
                    newRequest={newRequest}
                    newDataAvailable={newDataAvailable}
                    connectionStatus={connectionStatus}
                  />
                  <NewData
                    data={data}
                    onDisconnectDevice={disconnectDevice}
                    onSetNewDataAvailable={setNewDataAvailable}
                    deviceConnected={deviceConnected}
                    connectionStatus={connectionStatus}
                    hasDataToUpload={hasDataToUpload}
                  />
                </div>
              </div>
            </>
          }
        />
        <Route
          path="/sharedAccess"
          element={
            <>
              <div className="w-full flex justify-start">
                <LeftBlock 
                  deviceConnected={deviceConnected}
                  onNewDataAvailable={newDataAvailable} 
                  address={"/sharedAccess"} 
                  onDisconnectDevice={disconnectDevice}
                />
                <div className="w-full p-8 h-dvh flex flex-col flex-1">
                  <Header 
                    deviceConnected={deviceConnected} 
                    newRequest={newRequest}
                    newDataAvailable={newDataAvailable}
                    connectionStatus={connectionStatus}
                  />
                  <SharedAccess hasNewRequest={newRequest} onRequestHandled={() => setNewRequest(false)} />
                </div>
              </div>
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <div className="w-full flex justify-start">
                <LeftBlock 
                  deviceConnected={deviceConnected}
                  onNewDataAvailable={newDataAvailable} 
                  address={"/about"} 
                  onDisconnectDevice={disconnectDevice}
                />
                <div className="w-full p-8 h-dvh flex flex-col flex-1">
                  <Header 
                    deviceConnected={deviceConnected} 
                    newRequest={newRequest}
                    newDataAvailable={newDataAvailable}
                    connectionStatus={connectionStatus}
                  />
                  <About />
                </div>
              </div>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-[#000220] h-screen w-full text-white">
      <Router>
        <WalletProvider>
          <SerialPortProvider>
              <AppContent />
          </SerialPortProvider>
        </WalletProvider>
      </Router>
    </div>
  );
}