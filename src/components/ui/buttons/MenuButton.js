import React from "react";
import { Link } from "react-router-dom";
import cn from "../../../utils/cn"
// import Records from "../icons/Records";
// import Shared from "../icons/Shared";

export default function MenuButton({ text, link, selected, icon, left }) {
    return(
        <Link className="w-full" to={link} >
            <div className={cn(
                selected ? "bg-[#113766] text-white" : "bg-[#0E142E] text-[#9FD3E8]  hover:bg-[#020827]",
                left ? "rounded-l-2xl" : "rounded-r-2xl",
                "w-full flex mx-auto py-2 gap-2 font-semibold justify-center border-[#113766] border"
                )}>
                {/* <div className="w-4 h-4">
                    {icon === "records" && <Records />}
                    {icon === "shared" && <Shared />}
                </div> */}
                <div className="text-lg" >{text}</div>
            </div>
        </Link>
    )
}