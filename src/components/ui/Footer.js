import React from "react";
import GhostButton from "./buttons/GhostButton";

export default function Footer() {
    return(
        <div className="mx-auto p-3 rounded-2xl text-center bg-[#0E142E]">
            <GhostButton text={'About CipherPal'} link={"/about"} />
        </div>
    );
}