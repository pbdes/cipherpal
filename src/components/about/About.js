import React from "react";
import "../../App.css";

export default function Calendar() {

  return (
    <div className="w-full gradient-stroke flex flex-col flex-1 h-full max-h-full overflow-hidden">
      <div className="w-full pt-5 pl-8 pr-5 content flex-1 flex flex-col max-h-full overflow-hidden ">
        <div className="overflow-y-auto custom-scrollbar pr-2 pb-6">
            <h1 className="text-3xl font-semibold pb-6">About CipherPal</h1>
            <p>
                CipherPal is an innovative health tracking platform that connects your physical fidget device with blockchain technology to securely record and analyze your biometric data.
            </p>
            
            <p>
                Your device captures heart rate data along with your interaction patterns (clockwise rotation, counter-clockwise rotation, and button presses) during fidgeting sessions. This data is encrypted on-device and securely stored on the blockchain using IPFS and Polygon zkEVM Cardona Testnet.
            </p>
            
            <h2 className="text-lg pt-2">Key Features</h2>
            
            <ul className="space-y-2 pl-2 list-disc list-inside">
                <li>All data is encrypted both on your device and during transmission</li>
                <li>Your records are immutably stored on the Polygon blockchain</li>
                <li>Track patterns in your heart rate during fidgeting sessions</li>
                <li>Add mood tags and activity context to each session</li>
                <li>Easily browse your historical data by date</li>
                <li>Securely share your health data with trusted professionals</li>
            </ul>
        </div>
      </div>
    </div>
  );  
}