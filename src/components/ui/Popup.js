import React, { useState } from "react";
import data from "../../utils/ui_data.json";
import Close from "./icons/Close";
import CTAButtonNav from "./buttons/CTAButtonNav";

export default function Popup({ reason }) {
  const popup = data.popups[`${reason}`];
  const [isClose, setClose] = useState(false);
  
  if(isClose) {
    return null;
  }
  
  const handleClose = () => {
    setClose(true);
  };
  
  return(
    <div className="w-full p-3 flex justify-between content-center bg-[#150B20] border-2 border-[#4E2321] text-[#D35B23] text-lg rounded-2xl font-semibold">
      <h4>{popup.text}</h4>
      <div className="flex gap-2">
        <div className="flex gap-4">
          {popup.buttons.map((el, index) => {
            return(<CTAButtonNav text={el.text} link={el.link} key={index} orange={true} />)
          })}
        </div>
        <div 
          onClick={handleClose} 
          className="cursor-pointer hover:bg-[#92603A] hover:text-[#E9753F] rounded-full p-1 transition-colors"
        >
          <Close />
        </div>
      </div>
    </div>
  );
}