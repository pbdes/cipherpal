import React from "react";
// import Heart from "./icons/Heart";

export default function Heartbeat({ text, val }) {
    return(
        <div className="flex gap-1">
            {/* <Heart /> */}
            <p>{text}</p>
            {val && <div>{val}</div>}
            <p>BPM</p>
        </div>
    );
}