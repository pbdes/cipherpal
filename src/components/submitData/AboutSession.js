import React from "react";
import Edit from "../ui/icons/Edit";
import Tag from "../ui/Tag";
import Heartbeat from "../ui/Heartbeat";
import Heart from "../ui/icons/Heart";
import GhostButtonSmall from "../ui/buttons/GhostButtonSmall";

const placeholder = {
    startTime: "23:54:02",
    endTime: "23:59:27",
    min: 67,
    max: 109,
    avg: 98,
    id: 1
};

export default function AboutSession({ notes, session = placeholder, onEdit, onNotes, tot = 3 }) {
    return (
        <div>
            <header className="flex justify-between items-center">
                <div className="flex gap-5 items-center">
                    <div className="flex items-center font-bold text-xl pb-2 gap-2">
                        <h1 className="font-bold">{(session.id + 1) + "/" + tot}</h1>
                        <h3 className="font-semibold">{session.startTime} – {session.endTime}</h3>
                    </div>
                    <div className="flex gap-2 items-center text-[#F85ED4] text-lg pb-2">
                        <Heartbeat text={"min"} val={session.min} />
                        <Heart />
                        <Heartbeat text={"avg"} val={session.avg} />
                        <Heart />
                        <Heartbeat text={"max"} val={session.max} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="flex gap-2 cursor-pointer" onClick={() => {
                        onEdit(true);
                        onNotes({});
                    }}>
                        <GhostButtonSmall icon={<Edit />} text={"Edit notes"} />
                    </div>
                </div>
            </header>
            <div className="text-[#9FD3E8]">{notes.comment}</div>
            {notes.mood && (
                <main className="">
                    <div className="flex flex-wrap gap-2">
                        <div className="flex flex-wrap gap-2 py-3">
                            {notes.mood && notes.mood.map((el, i) => (
                                <Tag tag={el} selectable={false} key={i} />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 py-3">
                            {notes.activity && notes.activity.map((el, i) => (
                                <Tag tag={el} selectable={false} key={i} />
                            ))}
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}
