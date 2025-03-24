import React from "react";
import Tag from "../ui/Tag";
import Heartbeat from "../ui/Heartbeat";
import Heart from "../ui/icons/Heart";

export default function LoggedItem({ session }) {
  console.log("Rendering LoggedItem with session:", session);

  if (!session) {
    return null;
  }

  // Extract data from the session prop based on your actual data structure
  const {
    // id,
    min = 0,
    max = 0, 
    avg = 0,
    duration = 0,
    startTime,
    endTime,
    tags = [],
    notes = ""
  } = session;

  // Format time range
  let timeRange = "Time not available";
  
  // If startTime and endTime exist as timestamps
  if (startTime && endTime) {
    timeRange = `${startTime} – ${endTime}`;
  } 
  // If we have duration in milliseconds, calculate a time range based on duration
  else if (duration) {
    // Convert duration from milliseconds to minutes
    const durationMinutes = Math.round(duration / 60000);
    timeRange = `${durationMinutes} min session`;
  }

  // Truncate notes for preview
  const truncatedNotes = notes && notes.length > 60 
    ? `${notes.substring(0, 60)}...` 
    : notes;

  // If session has tags array, use it, otherwise create a temporary array with mood tags
  const sessionTags = tags && tags.length > 0 
    ? tags 
    : (session.mood ? [session.mood] : []);

  return (
    <div className="py-5 px-6 bg-[#121D3A] mb-6 rounded-2xl">
      <div className="flex font-bold text-xl pb-2">
        <h1>{timeRange}</h1>
      </div>
      <div className="flex justify-between items-center text-[#F85ED4] text-lg pb-2">
        <Heartbeat text={"min"} val={min} />
        <Heart />
        <Heartbeat text={"avg"} val={avg} />
        <Heart />
        <Heartbeat text={"max"} val={max} />
      </div>
      <p className="text-lg text-[#9FD3E8] pb-2">{truncatedNotes || "No notes for this session."}</p>
      <div className="flex w-full justify-between pt-2">
        <div className="flex flex-wrap items-center text-nowrap gap-3 text-xs">
          {sessionTags.length > 0 ? (
            sessionTags.map((tag, index) => (
              <Tag key={index} tag={tag} selectable={false} />
            ))
          ) : (
            <Tag tag={"No tags"} selectable={false} />
          )}
        </div>
      </div>
    </div>
  );
}