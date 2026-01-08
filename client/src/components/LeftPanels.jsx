import React from "react";

const LeftPanels = ({ playerCharacter, aura, vibe, role, round = 1, collabHost = "N/A", vibeCount = 0, doomerCount = 0 }) => {
  return (
    <>
      {/* Round Info */}
      <div className="relative w-80 h-30 top-5 left-5 rounded-3xl bg-transparent border-white border-2 flex flex-col justify-center items-center">
        <p className="text-2xl text-white mx-auto">
          Current Round: <span className="font-bold">{round}</span>
        </p>
        <p className="text-2xl text-white mx-auto">
          Collab Host: <span className="font-bold capitalize">{collabHost}</span>
        </p>
      </div>

      {/* Player Stats */}
      <div className="relative max-w-1/6 top-20 left-5 bg-transparent flex flex-col items-center justify-center gap-5">
        <p className="text-3xl text-white font-bold">Your Stats</p>

        <div className="w-full bg-white/10 rounded-3xl">
          <div className="p-5 flex gap-5">
            <img
              src={`/images/charactersFront/${playerCharacter}.png`}
              alt="playerCharacter"
              className="w-15"
            />
            <div>
              <p className="text-white text-xl capitalize">
                Color: <span className="font-bold">{playerCharacter}</span>
              </p>
              <p className={`text-xl font-bold ${role === 'doomer' ? 'text-red-400' : 'text-blue-400'}`}>
                Role: {role === 'doomer' ? 'Doomer' : 'Viber'}
              </p>
              <p className="text-white text-xl">
                Aura: <span className="font-bold">{aura}</span>
              </p>
              <p className="text-white text-xl">
                Vibe: <span className="font-bold">{vibe}/2</span>
              </p>
            </div>
          </div>
        </div>

        {/* Team Counts */}
        <div className="w-full bg-black/30 border-white border-2 rounded-3xl flex flex-col p-4 gap-5">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-full border-blue-500 border-2" />
              <p className="text-white text-2xl">Vibers</p>
            </div>
            <div className="flex">
              <div className="w-8 h-8 rounded-full border-red-500 border-2" />
              <p className="text-white text-2xl">Doomers</p>
            </div>
          </div>

          <div className="flex justify-center items-center gap-5">
            <img
              src="/images/charactersFront/white.png"
              alt="white front character"
              className="w-15"
            />
            <div className="flex flex-col">
              <p className="text-white text-xl">
                Vibers: <span className="font-bold">{vibeCount}</span> remaining
              </p>
              <p className="text-white text-xl">
                Doomers: <span className="font-bold">{doomerCount}</span> remaining
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftPanels;
