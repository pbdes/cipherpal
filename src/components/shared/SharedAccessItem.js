import React from "react";
// import GhostButtonSmall from '../ui/buttons/GhostButtonSmall';
import Tag from "../ui/Tag";

export default function SharedAccessItem({ fullname = "John Doe", role = "doctor", last = "02/01/24" }) {
    return (
        <div className="rounded-2xl flex w-full px-6 py-4 justify-between my-5 bg-[#121D3A]">
            <div className="flex gap-5 w-full justify-between">
                <div className="flex gap-5 items-center">
                    <h5 className="text-2xl font-bold">{fullname}</h5>
                    <Tag tag={role} selectable={false} />
                    {/* <p>{role}</p> */}
                </div>
                <p className="italic text-base text-[#9FD3E8] self-center">has access since {last}</p>
            </div>
            {/* <div className="self-center">
                <GhostButtonSmall text={"view details"} />
            </div> */}
        </div>
    );
}