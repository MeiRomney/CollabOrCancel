import React from "react";

const RightPanels = ({ playerCharacter, otherCharacters }) => {
  return (
    <div className="absolute top-5 right-5 bg-white/10 p-5 rounded-3xl flex flex-col gap-0">
      <h3 className="text-white text-xl font-bold mb-2">All Players</h3>

      {/* Player */}
      <div className="p-2 flex gap-5">
        <img
          src={`/images/charactersFront/${playerCharacter}.png`}
          alt="playerCharacter"
          className="w-10"
        />
        <div>
          <p className="text-white text-lg">
            Color: <span className="font-bold">{playerCharacter}</span>
          </p>
          <p className="text-white text-lg">
            Aura: <span className="font-bold">{playerCharacter.aura}</span>
          </p>
          <p className="text-white text-lg">
            Vibe: <span className="font-bold">{playerCharacter.vibe}/2</span>
          </p>
        </div>
      </div>

      {/* Other players */}
      {otherCharacters.slice(0, 7).map((character) => (
        <div key={character} className="p-2 flex gap-5">
          <img
            src={`/images/charactersFront/${character}.png`}
            alt={character}
            className="w-10"
          />
          <div>
            <p className="text-white text-lg">
              Color: <span className="font-bold">{character}</span>
            </p>
            <p className="text-white text-lg">
              Aura: <span className="font-bold">{character.aura}</span>
            </p>
            <p className="text-white text-lg">
              Vibe: <span className="font-bold">{character.vibe}/2</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RightPanels;
