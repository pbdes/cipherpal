import React from "react";
import Tags from "../ui/Tags";
import Comment from "../ui/Comment";

export default function Question({ notes, question, onNotes }) {
    return(
        <div className="">
            <h4 className="pt-3 pb-2 ">{question.text}</h4>
            <div>{question.type === 'tags' ? <Tags tags={question.content} short={question.short} onNotes={onNotes} notes={notes} /> : <Comment comment={question.content} short={question.short} onNotes={onNotes} notes={notes} />}</div>
        </div>
    )
}