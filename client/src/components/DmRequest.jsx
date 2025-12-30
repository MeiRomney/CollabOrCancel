import React from 'react'

const DmRequest = ({ dmRequest, onAccept, onReject, playerColor }) => {
  if(!dmRequest) return null;

  return playerColor === dmRequest.to ? (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white p-4 rounded-xl flex items-center gap-5 z-50">

        {/* Animate countdown */}
        {/* <p className="text-white text-2xl font-bold animate-pulse">
        ⏳ {dmCountdown}s
        </p> */}
        <img src={`/images/charactersHead/${dmRequest.to}.png`} alt={`${dmRequest.to}Head`} className="w-8 h-8" />
        <p className="text-white text-xl font-bold">
            {dmRequest.to} - DM request from {dmRequest.from}
        </p>
        <img src={`/images/charactersHead/${dmRequest.from}.png`} alt={`${dmRequest.from}Head`} className="w-8 h-8" />

        {/* Accept */}
        <button 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-all duration-500"
          onClick={onAccept}  
        >
          Accept
        </button>

        {/* Decline */}
        <button
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-all duration-500"
          onClick={onReject}
        >
          Decline
        </button>
    </div>
  ) : playerColor === dmRequest.from ? (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white p-4 rounded-xl flex items-center gap-5 z-50">

        {/* Animate countdown */}
        {/* <p className="text-white text-2xl font-bold animate-pulse">
        ⏳ {dmCountdown}s
        </p> */}
        <img src={`/images/charactersHead/${dmRequest.from}.png`} alt={`${dmRequest.from}Head`} className="w-8 h-8" />
        <p className="text-white text-xl font-bold">
            {dmRequest.from} - Waiting for {dmRequest.to} to accept DM
        </p>
        <img src={`/images/charactersHead/${dmRequest.to}.png`} alt={`${dmRequest.to}Head`} className="w-8 h-8" />
    </div>
  ) : null;
}

export default DmRequest;