import React from "react";
import { Link } from "react-router-dom";

export default function GhostButton({ text, link = "/" }) {
    return(
        <div className="font-normal text-[#5981DC] hover:text-[#769AEB] focus:text-[#113766]">
            <Link to={link}>
                <button className="font-semibold">{text}</button>
            </Link>
        </div>
    )
}