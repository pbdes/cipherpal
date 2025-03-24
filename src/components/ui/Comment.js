import React, { useEffect, useState } from "react";

export default function Comment({ notes, comment, onNotes, short }) {
    const [value, setValue] = useState('');

    useEffect(() => {
        const local = notes
        local[short] = value
        onNotes(local);
    }, [value, notes, onNotes, short]);

    return(
        <div>
            <textarea className="bg-[#000220] rounded-xl px-2 text-[#9FD3E8] placeholder-[#60829B] py-1  w-full" placeholder={comment} onChange={(e) => setValue(e.target.value)}></textarea>
        </div>
    )
}