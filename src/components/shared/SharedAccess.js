import React, { useState } from "react";
import NewRequestItem from "./NewRequestItem";
import SharedAccessItem from "./SharedAccessItem";


export default function SharedAccess() {

  const [showRequest, setShowRequest] = useState(true);
  const [acceptedRequest, setAcceptedRequest] = useState(null);

  // Handler for Accept button
  const handleAccept = (name, role) => {
    setAcceptedRequest({ fullname: name, role: role });
    setShowRequest(false);
  };

  // Handler for Decline button
  const handleDecline = () => {
    setShowRequest(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-10 gradient-stroke max-h-full overflow-hidden">
      <div className="content flex-1 w-full pl-8 pr-4 py-5 flex-1 overflow-hidden">
        <div className="max-h-full pr-3 overflow-y-auto custom-scrollbar">
          <h1 className="text-3xl font-semibold mb-7">Shared Access</h1>
          
          {/* Conditionally render the NewRequestItem */}
          {showRequest && (
            <NewRequestItem 
              fullname="Mario Ricco"
              role="doctor"
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}
          
          {/* Render the newly accepted request if it exists */}
          {acceptedRequest && (
            <SharedAccessItem 
              fullname={acceptedRequest.fullname} 
              role={acceptedRequest.role} 
              last="just now" 
            />
          )}
          
          {/* Existing SharedAccessItems */}
          <SharedAccessItem />
          <SharedAccessItem fullname={"Maria Perez"} role={"therapist"} last="today" />
        </div>
      </div>
    </div>
  );
}