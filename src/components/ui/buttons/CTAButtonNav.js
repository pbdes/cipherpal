import React from "react";
import { Link } from "react-router-dom";
import cn from "../../../utils/cn";

export default function CTAButtonNav({ text, link, orange, icon }) {
    return(
        <div className="font-normal">
            <Link to={link} >
                <button className={cn(
                orange ? `bg-[#D35B23] hover:bg-[#BD5524] focus:bg-[#8A350E]` : "bg-[#113766]",
                "mx-auto py-1 px-4 text-white font-semibold rounded-xl text-base"
                )}> {text}</button>
            </Link>
        </div>
    )
}