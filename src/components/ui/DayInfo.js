import React from "react";
import Heartbeat from "../ui/Heartbeat";
import Explorer from "./icons/Explorer";
import Fidget from "../ui/icons/Fidget";
import Clock from "../ui/icons/Clock";
import Most from "../ui/icons/Most";
import Heart from "../ui/icons/Heart";

export default function DayInfo({ 
  date, 
  len = 0, 
  avg = 0, 
  min = 0, 
  max = 0, 
  duration = 0, 
  dataId, 
  form = false, 
  dominantType,
  BPMshow = true
}) {
  // Construct URL for Polygon zkEVM Cardona Testnet explorer
  const getPolygonZkEvmExplorerUrl = () => {
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    
    if (contractAddress && !form) {
      // Using the Polygon zkEVM Cardona Testnet explorer
      return `https://cardona-zkevm.polygonscan.com/address/${contractAddress}`;
    }
    return null;
  };

  const explorerUrl = getPolygonZkEvmExplorerUrl();

  // Convert dominantType to human-readable format
  const getDominantTypeText = (type) => {
    switch (type) {
      case "cw":
        return "clockwise knob";
      case "ccw":
        return "counter-clockwise knob";
      case "p":
        return "button";
      default:
        return "unknown";
    }
  };

  return (
    <div className="mb-6">
      <div className="w-full flex justify-between items-center">
        <span className="font-semibold text-2xl">{date}</span>
        {explorerUrl && (
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#9FD3E8] hover:text-[#79BDD9] text-lg flex gap-2 items-center"
            title="View on Polygon zkEVM Explorer"
          >
            <span>See on Polygonscan</span>
            <Explorer />
          </a>
        )}
      </div>
      <div className="text-[#9FD3E8] text-xl my-4 font-medium">
        <div className="w-full flex gap-2 items-center pb-2">
          <Fidget />
          <p>You fidgeted {len} times</p>
        </div>
        <div className="w-full flex gap-2 items-center pb-2">
          <Most />
          <p>Mostly you used {getDominantTypeText(dominantType)}</p>
        </div>
        <div className="w-full flex gap-2 items-center">
          <Clock />
          <p>Total duration of {duration} min</p>
        </div>
      </div>
      {BPMshow &&
        <div className="flex justify-between items-center px-8 py-2 bg-[#1B1138] text-[#F85ED4] text-xl rounded-full">
          <Heartbeat text={"min"} val={min} />
          <Heart />
          <Heartbeat text={"avg"} val={avg} />
          <Heart />
          <Heartbeat text={"max"} val={max} />
        </div>
      }
    </div>
  );
}
