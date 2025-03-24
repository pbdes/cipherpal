import React from "react";
import AboutDevice from "../device/AboutDevice";
import MenuButton from "./buttons/MenuButton";
import Logo from "./icons/Logo";
import Footer from "./Footer";

export default function LeftBlock({ onNewDataAvailable, address, deviceConnected, onDisconnectDevice }) {
    return (
        <div className="w-1/4 min-w-[350px] max-w-[400px] flex-shrink-0 h-screen bg-[#0E1028] pb-8 px-8 flex flex-col">
            {/* Logo Section */}
            <div className="w-full p-8 pt-6 mb-4">
                <Logo />
            </div>

            {/* Content Section (Takes Full Remaining Space) */}
            <div className="flex-1">
                <div className="w-full flex pb-2">
                    <MenuButton text={"Dashboard"} link="/dashboard" selected={address === "/dashboard"} icon={"records"} left={true} />
                    <MenuButton text={"Shared Access"} link="/sharedAccess" selected={address === "/sharedAccess"} icon={"shared"} />
                </div>
                <AboutDevice 
                    onNewDataAvailable={onNewDataAvailable} 
                    deviceConnected={deviceConnected} 
                    onDisconnectDevice={onDisconnectDevice} 
                />
            </div>

            {/* Footer (Always at Bottom) */}
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
