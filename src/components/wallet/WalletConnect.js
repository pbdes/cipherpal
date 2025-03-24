import React, { useEffect } from "react";
import { useWallet } from "../../WalletContext";
import { useNavigate } from "react-router-dom";
import CTAButton from "../ui/buttons/CTAButton";
import "../../App.css";
import Logo from  "../ui/icons/Logo";
import Wallet from "../ui/icons/Wallet";

export default function WalletConnect() {
  const navigate = useNavigate();
  const {
    isMetaMaskInstalled,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
    isLoading,
    networkName,
  } = useWallet();

  useEffect(() => {
    if (!isLoading && isConnected && isCorrectNetwork) {
      navigate("/");
    }
  }, [isLoading, isConnected, isCorrectNetwork, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white shadow-md rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-6">Checking Wallet Status</h1>
          <p>Please wait while we check your wallet configuration...</p>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    console.log("Connect button clicked");

    if (!isConnected) {
      const connected = await connectWallet();
      if (connected && !isCorrectNetwork) {
        await switchNetwork();
      }
    } else if (!isCorrectNetwork) {
      await switchNetwork();
    }
  };

  let buttonText = "Connect";
  // let statusMessage = "";

  if (!isMetaMaskInstalled) {
    buttonText = "Install MetaMask";
    // statusMessage = "MetaMask is not installed. Please install MetaMask to continue.";
  } else if (!isConnected) {
    buttonText = "Connect Wallet";
    // statusMessage = "Please connect your wallet to continue.";
  } else if (!isCorrectNetwork) {
    buttonText = `Switch to ${networkName}`;
    // statusMessage = `Please switch to ${networkName} network to continue.`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full">
      {/* Outer Gradient Stroke Wrapper */}
      <div className="gradient-stroke">
        {/* Inner Content Box */}
        <div className=" w-full p-8 text-white rounded-2xl content flex flex-col items-center justify-center">
          <div className="w-full items-center flex justify-center mb-8 mt-4">
            <div className="w-1/2">
              <Logo />
            </div>
          </div>
          {/* <h1 className="text-2xl font-bold text-center mb-6">
            Connect Your Wallet
          </h1> */}
          {/* <div className="text-center mb-6 text-lg">
            <p>{statusMessage}</p>
          </div> */}

          {/* MetaMask status debugging */}
          <div className="mb-8 p-4 bg-[#121D3A] rounded-lg text-s">
            {/* <h3 className="font-semibold mb-2">Wallet Status:</h3> */}
            <p>{isMetaMaskInstalled ? "MetaMask installed ✅" : "MetaMask is not installed 🚫"}</p>
            <p>{isConnected ? "App is connected to Wallet ✅" : "App is not connected to Wallet 🚫"}</p>
            <p>{isCorrectNetwork ? "Wallet is on Correct Network ✅" : "You need to switch the network to Polygon zkEVM Cardona Testnet 🚫"}</p>
          </div>

          {!isMetaMaskInstalled ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <CTAButton className="w-3/5" text={buttonText} />
            </a>
          ) : (
            <CTAButton icon={<Wallet />} className="w-3/5" text={buttonText} onClick={handleConnect} />
          )}


        </div>
      </div>
    </div>
  );
}
