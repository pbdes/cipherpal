import React, { useState } from "react";
import cn from "../../utils/cn";

export default function Tag({ tag, selectable = true, handleTagClick }) {
    const [selected, setSelected] = useState(false);

    return(
        <div className={cn(
            selected ? "text-[#121D3A] bg-[#9FD3E8]" : "text-[#9FD3E8]",
            selectable ? "cursor-pointer hover:bg-[#020827]" : "text-[#9FD3E8]",
            "py-1 px-3 rounded-lg text-[#9FD3E8] text-base border border-[#9FD3E8]")}
            onClick={() => {
                if(selectable) {
                    setSelected(prev => !prev)
                    handleTagClick(tag)
                }
            }}>{tag}
        </div>
    )
}