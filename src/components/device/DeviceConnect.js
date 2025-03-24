import React, { useEffect } from "react";
import Image from "../ui/Image";
import GhostButton from "../ui/buttons/GhostButton";
import CTAButton from "../ui/buttons/CTAButton";
import { Navigate } from "react-router-dom";
import { useSerialPort } from "../../SerialPortContext";
import { useWallet } from "../../WalletContext";

export default function DeviceConnect() {
  const { 
    deviceConnected, 
    connectionStatus, 
    connectReadSerial, 
    deviceWallet,
    closePortAfterInit 
  } = useSerialPort();
  const { account } = useWallet();
  
  useEffect(() => {
    if (connectionStatus === "initialized") {
      console.log("Device initialized, closing port in 1 second...");
      const timer = setTimeout(() => {
        closePortAfterInit();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, closePortAfterInit]);
  
  if (deviceConnected === true && connectionStatus === "connected") {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleConnect = () => {
    connectReadSerial(account);
  };
  
  let statusMessage = "Ready to connect";
  let statusDetails = "Make sure your device is connected to your laptop via USB.";
  let buttonDisabled = false;
  let errorState = false;
  let buttonText = "Connect Device";

  switch (connectionStatus) {
    case "connecting":
      statusMessage = "Connecting to Smart Fidget...";
      statusDetails = "Please wait while we establish a connection.";
      buttonDisabled = true;
      buttonText = "Connecting...";
      break;
    case "authenticating":
      statusMessage = "Authenticating device...";
      statusDetails = "Verifying your wallet with the device.";
      buttonDisabled = true;
      buttonText = "Authenticating...";
      break;
    case "connected":
      statusMessage = "Device connected!";
      statusDetails = "Redirecting to your records...";
      buttonDisabled = true;
      buttonText = "Connected!";
      break;
    case "initialized":
      statusMessage = "Device initialized successfully!";
      statusDetails = "Your wallet has been registered with the device.";
      buttonDisabled = true;
      buttonText = "Device Ready!";
      break;
    case "wallet_mismatch":
      statusMessage = "Wallet Mismatch Error";
      statusDetails = `This device is registered to another wallet (${deviceWallet?.substring(0, 6)}...${deviceWallet?.substring(deviceWallet.length - 4)}). Please connect with the original wallet.`;
      errorState = true;
      buttonText = "Try Different Wallet";
      break;
    default:
      break;
  }
  
  return (
    <div className="justify-center text-center w-full min-h-screen bg-[#000220] text-white flex flex-col items-center">
      <div className="w-1/3 bg-gray-200 px-20 py-40 mx-auto rounded-full">
        <Image />
      </div>
      <h3 className={`text-2xl mt-10 font-semibold ${errorState ? 'text-red-600' : connectionStatus === "initialized" ? 'text-green-600' : ''}`}>
        {statusMessage}
      </h3>
      <p className={`p-1 italic ${errorState ? 'text-red-500' : connectionStatus === "initialized" ? 'text-green-500' : 'text-[#9FD3E8]'}`}>
        {statusDetails}
      </p>
      {account && (
        <p className="mt-2 text-sm text-[#9FD3E8]">
          Connected wallet: {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </p>
      )}
      
      <div className="w-1/3">
        <CTAButton
          text={buttonText}
          onClick={handleConnect}
          disabled={buttonDisabled}
          className={`w-1/3 mt-10 ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="mt-4">
        <GhostButton text={"Continue without Device"} link={"/dashboard"} />
      </div>
    </div>
  );
}
