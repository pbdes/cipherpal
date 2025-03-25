import React from "react";
import Question from "./Question";
import data from '../../utils/ui_data.json';
import CTAButton from "../ui/buttons/CTAButton";
import Heartbeat from "../ui/Heartbeat";
import Heart from "../ui/icons/Heart"

export default function Correlations({ notes, session, tot = 3, onEdit, onNotes }) {
    const questions = data.questions;

    return(
        <div>
            <main>
                <div className="flex items-center justify-between">
                    <div className="flex gap-5 content-center">
                        <h1 className="text-xl flex font-bold">{session.id + "/" + tot}</h1>
                        <h3 className="text-lg font-semibold">{session.startTime} – {session.endTime}</h3>
                        <div className="flex gap-2 items-center text-[#F85ED4] text-lg pb-2">
                            <Heartbeat text={"min"} val={session.min} />
                            <Heart />
                            <Heartbeat text={"avg"} val={session.avg} />
                            <Heart />
                            <Heartbeat text={"max"} val={session.max} />
                        </div>
                    </div>
                    <div className="w-1/5 justify-end" onClick={() => onEdit(false)} >
                        <CTAButton text={"Save"} />
                    </div>
                </div>
                <div>
                    {questions.map((question)=>{
                        return(<Question question={question} key={question.id} onNotes={onNotes} notes={notes} />)
                    })}
                </div>
            </main>
        </div>
    )
}