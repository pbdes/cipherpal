import React from "react";

export default function CTAButton({ text, onClick, className, icon, disabled }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 px-4 flex items-center justify-center gap-4 
        bg-[#113766] text-white font-bold rounded-3xl shadow-md 
        hover:bg-[#0A2D57] focus:bg-[#08274E] 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className || "w-full"}`}
    >
      {icon && (
        <span className="flex items-center justify-center w-5 h-5">
          {icon}
        </span>
      )}
      <span className="flex items-center">{text}</span>
    </button>
  );
}
