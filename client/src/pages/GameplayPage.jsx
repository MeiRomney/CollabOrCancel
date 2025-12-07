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

      <div className="absolute w-80 h-30 top-5 left-5 rounded-3xl bg-transparent border-white border-2 flex flex-col justify-center items-center">
        <p className="text-2xl text-white mx-auto">Current Round: <span className="font-bold">1</span></p>
        <p className="text-2xl text-white mx-auto">Overlord: <span className="font-bold">David (red)</span></p>
      </div>

      <div className="absolute bottom-0 w-full h-50 bg-transparent z-4 flex justify-center items-center gap-10">
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
