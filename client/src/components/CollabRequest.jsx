import React from 'react'
import toast from 'react-hot-toast';

const CollabRequest = ({ collabRequest, collabCountdown, playerCharacter, collabTimer, clearCollabTimers, setCollabTimer, setCollabRequest }) => {
  
  if(!collabRequest || collabRequest.from !== playerCharacter) return null;
  
  return (
    
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white p-4 rounded-xl flex items-center gap-5 z-50">

          {/* Animate countdown */}
          <p className="text-white text-2xl font-bold animate-pulse">
          ⏳ {collabCountdown}s
          </p>
          <img src={`/images/charactersHead/${playerCharacter}.png`} alt={`${playerCharacter}Head`} className="w-8 h-8" />
          <p className="text-white text-xl font-bold">
              {playerCharacter} - Are you sure you want to propose a Collab?
          </p>

          {/* Accept */}
          <button 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-all duration-500"
          onClick={() => {
              // Accept: clear timers and close
              if (collabTimer) {
                clearCollabTimers(collabTimer);
                setCollabTimer(null);
              }
              setCollabRequest(null);
              toast.success("Collab proposed");
          }}  
          >
            Yes
          </button>

          {/* Decline */}
          <button
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-all duration-500"
          onClick={() => {
              if (collabTimer) {
                clearCollabTimers(collabTimer);
                setCollabTimer(null);
              }
              setCollabRequest(null);
          }}
          >
            No
          </button>
        </div>
  )
}

export default CollabRequest