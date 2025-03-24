import React from "react";

export default function GhostButtonSmall({ text, icon }) {
    return(
        <div className="font-normal text-[#5981DC] hover:text-[#769AEB] focus:text-[#113766] flex items-center gap-2">
            <span className="flex items-center text-[#5981DC] hover:text-[#769AEB] focus:text-[#113766] justify-center w-5 h-5">
                {icon}
             </span>
            <p>{text}</p>
        </div>
    )
}