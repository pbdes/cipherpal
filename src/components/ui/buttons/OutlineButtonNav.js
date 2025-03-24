import React from "react";
import { Link } from "react-router-dom";

export default function OutlineButtonNav({ text, link }) {
    return(
        <div className="font-normal">
            <Link to={link} >
                <button className="w-full py-2 px-4 bg-[#113766] text-white font-bold rounded-3xl shadow-md hover:bg-[#0A2D57] focus:bg-[#08274E]">{text}</button>
            </Link>
        </div>
    )
}