import React, { useState } from "react";
import BackgroundImage from "/images/gameplayBackground.png";

const GameplayPage = () => {
  const [doomer, setDoomer] = useState(true);

  const characterColors = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white", "purple", "brown", "cyan", "lime", "maroon", "rose", "banana", "gray", "tan", "coral"];
  const viberAbilities = ["chat", "dm", "proposeCollab", "collab", "defend", "heal", "vote", "sabotage", "note"];
  const doomerAbilities = ["chat", "dm", "proposeCollab", "collab", "defend", "heal", "vote", "invisibleSabotage", "attack", "note"];

  const playerCharacter = characterColors[0];
  const otherCharacters = characterColors.slice(1);

  const backgroundStyle = {
    backgroundImage: `url(${BackgroundImage})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh",
    position: "relative",
  };

  const characterPositions = [
    { top: "60%", left: "26%" },
    { top: "50%", left: "33%" },
    { top: "45%", left: "41%" },
    { top: "43%", left: "50%" },
    { top: "45%", left: "60%" },
    { top: "50%", left: "68%" },
    { top: "60%", left: "75%" },
  ];

  // Split camel case into separate words
  const formatAbilityName = (name) => {
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
    if(words.length > 1) {
      return (
        <>
          {words[0].toUpperCase()}
          <br/>
          {words.slice(1).join(' ').toUpperCase()}
        </>
      );
    }
    return name.toUpperCase();
  };

  // Check if ability name has multiple words
  const hasMultipleWords = (name) => {
    return /([a-z])([A-Z])/.test(name);
  }

  return (
    <div style={backgroundStyle}>

      {/* Table */}
      <img
          src="/images/table.png"
          alt="table"
          style={{
          position: "absolute",
          width: "850px",
          left: "50%",
          top: "70%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          }}
      />

      {/* Player Character */}
      <img
          src={`/images/charactersBack/${playerCharacter}.png`}
          alt="player"
          style={{
          position: "absolute",
          width: "200px",
          left: "50%",
          top: "52%",
          transform: "translateX(-50%)",
          zIndex: 3,
          }}
      />

      {/* Other Characters */}
      {characterPositions.map((pos, i) => {
          let imageSrc = `/images/characters/${otherCharacters[i]}.png`
          if(i === 3) {
              imageSrc = `images/charactersFront/${otherCharacters[i]}.png`
          }
          return (
              <img
                  key={i}
                  src={imageSrc}
                  alt={`npc-${i}`}
                  style={{
                      position: "absolute",
                      width: `${i === 0 || i=== 6 ? "160px" : i === 1 || i === 5 ? "150px" : "140px"}`,
                      ...pos,
                      transform: `translate(-50%, -50%) ${i < 3 ? "scaleX(-1)" : ""}`,
                      zIndex: 1,
                  }}
              />
          )
      })}

      {/* Left panels */}
      <div className="relative w-80 h-30 top-5 left-5 rounded-3xl bg-transparent border-white border-2 flex flex-col justify-center items-center">
        <p className="text-2xl text-white mx-auto">Current Round: <span className="font-bold">1</span></p>
        <p className="text-2xl text-white mx-auto">Overlord: <span className="font-bold">David (red)</span></p>
      </div>

      <div className="relative max-w-1/6 top-20 left-5 bg-transparent flex flex-col items-center justify-center gap-5">
        <p className="text-3xl text-white font-bold">Player Stats</p>
        <div className="w-full bg-white/10 rounded-3xl">
          <div className="p-5 flex gap-5">
            <img src={`/images/charactersFront/${playerCharacter}.png`} alt="playerCharacter" className="w-15" />
            <div>
              <p className="text-white text-xl">Name: <span className="font-bold">Player name</span></p>
              <p className="text-white text-xl">Role: <span className="font-bold">Viber</span></p>
              <p className="text-white text-xl">Aura: <span className="font-bold">5</span></p>
              <p className="text-white text-xl">Vibe: <span className="font-bold">2/2</span></p>
            </div>
          </div>
        </div>

        <div className="w-full bg-black/30 border-white border-2 rounded-3xl flex flex-col p-4 gap-5">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-full border-blue-500 border-2"></div>
              <p className="text-white text-2xl">Vibers</p>
            </div>
            <div className="flex">
              <div className="w-8 h-8 rounded-full border-red-500 border-2"></div>
              <p className="text-white text-2xl">Doomers</p>
            </div>
          </div>

          <div className="flex justify-center items-center gap-5">
            <img src="/images/charactersFront/white.png" alt="white front character" className="w-15" />
            <div className="flex flex-col">
              <p className="text-white text-xl">Vibers: <span className="font-bold">6</span> remaining</p>
              <p className="text-white text-xl">Doomers: <span className="font-bold">2</span> remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panels */}
      <div className="absolute top-5 right-5 bg-white/10 p-5 rounded-3xl flex flex-col gap-0">
        <div className="p-2 flex gap-5">
          <img src={`/images/charactersFront/${playerCharacter}.png`} alt="playerCharacter" className="w-10" />
          <div>
            <p className="text-white text-lg">Name: <span className="font-bold">Player name</span></p>
            <p className="text-white text-lg">Aura: <span className="font-bold">5</span></p>
            <p className="text-white text-lg">Vibe: <span className="font-bold">2/2</span></p>
          </div>
        </div>
        {otherCharacters.map((character, index) => {
          if(index >= 7) {
            return null;
          }
          return (
            <div 
              key={character}
              className="p-2 flex gap-5"
            >
              <img src={`/images/charactersFront/${character}.png`} alt="playerCharacter" className="w-10" />
              <div>
                <p className="text-white text-lg">Name: <span className="font-bold">Player name</span></p>
                <p className="text-white text-lg">Aura: <span className="font-bold">5</span></p>
                <p className="text-white text-lg">Vibe: <span className="font-bold">2/2</span></p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Abilities buttons */}
      <div className="absolute bottom-0 w-full h-50 bg-transparent z-4 flex justify-center items-center gap-2">
        {doomer ? (
          doomerAbilities.map((name, i) => {
            return (
              <button
                key={i}
                className="w-30 h-30 rounded-full bg-black opacity-80 border-white border-2 flex items-center justify-center flex flex-col cursor-pointer transition-all duration-500 hover:scale-110 hover:opacity-100 active:scale-95 active:opacity-100"
              >
                <img src={`/images/${name}.png`} alt={`ability ${i}`} className="w-10 h-10" />
                <p className={`text-white ${hasMultipleWords(name) ? 'text-md' : 'text-xl'}`}>{formatAbilityName(name)}</p>
              </button>
            )
          })
        ) : (
          viberAbilities.map((name, i) => {
            return (
              <button
                key={i}
                className="w-30 h-30 rounded-full bg-black opacity-80 border-white border-2 flex items-center justify-center flex flex-col cursor-pointer transition-all duration-500 hover:scale-110 hover:opacity-100 active:scale-95 active:opacity-100"
              >
                <img src={`/images/${name}.png`} alt={`ability ${i}`} className="w-10 h-10" />
                <p className={`text-white ${hasMultipleWords(name) ? 'text-md' : 'text-xl'}`}>{formatAbilityName(name)}</p>
              </button>
            )
          })
        )}
        
        
      </div>

    </div>
  );
};

export default GameplayPage;
