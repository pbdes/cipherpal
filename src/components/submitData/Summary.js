import React from "react";
// import { Link } from "react-router-dom";
// import ArrowLeft from "../ui/icons/ArrowLeft";
import DayInfo from "../ui/DayInfo";
import Heart from "../ui/icons/Heart";
import Heartbeat from "../ui/Heartbeat";

export default function Summary({ date, len, avg, min, max, duration, form, dominantType}) {
    return(
        <header className="">
            <div className="">
                {/* <Link to="/dashboard">
                    <ArrowLeft />
                </Link> */}
                <h1 className="text-3xl font-bold"> Upload New Record about {date}</h1>
                <div className="w-1/2 mt-4 flex justify-between items-center px-8 py-2 bg-[#1B1138] text-[#F85ED4] text-xl rounded-full">
                    <Heartbeat text={"min"} val={min} />
                    <Heart />
                    <Heartbeat text={"avg"} val={avg} />
                    <Heart />
                    <Heartbeat text={"max"} val={max} />
                </div>
            </div>
            <div className="w-1/2">
                <DayInfo len={len} avg={avg} min={min} max={max} duration={duration} form={form} BPMshow={false} dominantType={dominantType} />
            </div>
        </header>
);
}