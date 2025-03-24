import React from "react";
import { Link } from "react-router-dom";
import Battery from "../ui/icons/Battery";
import OnNewData from "./OnNewData";
import CTAButton from "../ui/buttons/CTAButton";
import Disconnect from "../ui/icons/Disconnect";

export default function AboutDevice({ onNewDataAvailable, deviceConnected, lastUsedDate = "24.04.2024", onDisconnectDevice }) {
  function handleClick() {
    console.log('check')
    onDisconnectDevice();
  }
  return(
    <div className="w-full mt-5 border-2 h-fit bg-[#1D243B] border border-[#5981DC] rounded-2xl">
      <div className="p-4">
        <div className="w-full">
          {deviceConnected ? (
            <div className="w-full justify-between flex">
              <h1 className="text-2xl font-bold">My Pal</h1>
              <div className="text-[#9FD3E8]" onClick={handleClick}>
                <Disconnect />
              </div>
            </div>
          ) : (<h1 className="text-2xl font-bold">My Pal</h1>)}
        </div>
        <p className="text-xs text-[#9FD3E8]">
          {deviceConnected 
            ? `Connected now` 
            : ` `}
        </p>
      </div>
      <div className="p-5 pt-0 text-base text-[#9FD3E8]">
        {deviceConnected ? (
          <>
            <div className="flex gap-2 pb-2"><Battery /><p className="self-center">50%</p></div>
            {onNewDataAvailable && <OnNewData />}
          </>
        ) : (
          <div className="flex flex-col">
            <p className="mb-4">No device connected</p>
            <div className="w-full flex justify-center">
              <div className="w-full mx-auto">
                <Link to="/" className="block w-full">
                  <CTAButton className="w-full" text="Connect Device" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}