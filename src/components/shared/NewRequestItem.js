import React from "react";

export default function NewRequestItem({ 
  fullname = "Mario Ricco", 
  role = "doctor", 
  onAccept, 
  onDecline 
}) {
  return (
    <div className="rounded-2xl my-5 bg-[#140A27] border border-[#BA162A] text-[#E83148] py-4 px-6">
      <div>
        <h3 className="text-2xl font-semibold">New Access Request</h3>
        <div className="mt-3 flex gap-2 items-base pb-4">
          <p className="text-lg">
            <span className="text-lg font-semibold">{fullname},</span>
            <span> {role}, </span>
            wants to get access to your personal data.
            <br />
            If you accept, they will have full access to your data collected by CipherPal. You will receive 0.0067ETH (~$2).</p>
        </div>
      </div>
      <div className="w-full flex gap-5 flex-wrap justify-end">
        <button 
          className="bg-[#5B5368] hover:bg-[#4A4259] rounded-lg text-white px-10 py-1"
          onClick={() => onDecline()}
        >
          Decline Request
        </button>
        <button 
          className="bg-[#BA162A] hover:bg-[#840D1B] rounded-lg text-white py-1 px-10"
          onClick={() => onAccept(fullname, role)}
        >
          Accept Request
        </button>
      </div>
    </div>
  );
}