import React from "react";
import dayjs from "dayjs";
import LoggedItem from "./LoggedItem";
import DayInfo from "../ui/DayInfo";

export default function Record({ sessions = [], date, details = {} }) {
    // Ensure date is properly formatted even if it's not a dayjs object
    const formattedDate = date 
        ? (dayjs.isDayjs(date) ? date.toDate().toDateString() : dayjs(date).toDate().toDateString())
        : "No date selected";

    // Calculate the highest value among `cw`, `ccw`, and `p` across all sessions
    const getDominantValue = (sessions) => {
        let cwTotal = 0;
        let ccwTotal = 0;
        let pTotal = 0;

        sessions.forEach(session => {
            cwTotal += session.cw || 0;
            ccwTotal += session.ccw || 0;
            pTotal += session.p || 0;
        });

        // Determine the dominant type
        if (cwTotal >= ccwTotal && cwTotal >= pTotal) return "cw";
        if (ccwTotal >= cwTotal && ccwTotal >= pTotal) return "ccw";
        return "p"; // If `p` is the highest
    };

    const dominantType = getDominantValue(sessions);

    if (sessions.length > 0) {
        return (
            <div className="pl-5 pr-2">
                <DayInfo 
                    date={details.date || formattedDate} 
                    len={details.len || 0}
                    avg={details.avg || 0} 
                    min={details.min || 0} 
                    max={details.max || 0} 
                    duration={details.totDuration || 0} 
                    dominantType={dominantType}
                />
                {sessions.map((session, index) => (
                    <LoggedItem session={session} key={index} />
                ))}
            </div>
        );
    } else {
        return (
            <div className="pl-5 pr-2">
                <h1 className="font-semibold text-2xl pb-3">{formattedDate}</h1>
                <p>Unfortunately, there are no sessions recorded for that day.</p>
            </div>
        );
    }
}
