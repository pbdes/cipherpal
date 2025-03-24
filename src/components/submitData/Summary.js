import React from "react";
// import { Link } from "react-router-dom";
// import ArrowLeft from "../ui/icons/ArrowLeft";
import DayInfo from "../ui/DayInfo";

export default function Summary({ date, len, avg, min, max, duration, form}) {
    return(
        <header className="">
            <div>
                {/* <Link to="/dashboard">
                    <ArrowLeft />
                </Link> */}
                <h1 className="text-3xl font-bold"> Upload New Record about {date}</h1>
            </div>
            <div className="w-full">
                <DayInfo len={len} avg={avg} min={min} max={max} duration={duration} form={form} />
            </div>
        </header>
);
}