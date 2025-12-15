import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import BackgroundImage from "/images/gameplayBackground.png";
import GameChat from "../components/GameChat";
import Dm from "../components/Dm";
import DmRequest from "../components/DmRequest";
import CollabRequest from "../components/CollabRequest";
import CollabVote from "../components/CollabVote";
import Vote from "../components/Vote";
import Note from "../components/Note";

const GameplayPage = () => {
  const [doomer, setDoomer] = useState(true);
  const [chat, setChat] = useState(false);
  const [dm, setDm] = useState(false);
  const [selectingDmTarget, setSelectingDmTarget] = useState(false);

  const [dmRequest, setDmRequest] = useState(null);
  const [dmTimer, setDmTimer] = useState(null);
  const [dmCountdown, setDmCountdown] = useState(10);

  const [collabRequest, setCollabRequest] = useState(null);
  const [collabCountdown, setCollabCountdown] = useState(10);
  const [collabTimer, setCollabTimer] = useState(null);

  const [collab, setCollab] = useState(false);
  const [vote, setVote] = useState(false);
  const [note, setNote] = useState(false);

  const [selectingAbility, setSelectingAbility] = useState(null);
  const [abilityVotes, setAbilityVotes] = useState({});

  const characterColors = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white", "purple", "brown", "cyan", "lime", "maroon", "rose", "banana", "gray", "tan", "coral"];
  const viberAbilities = ["chat", "dm", "proposeCollab", "collab", "vote", "defend", "heal", "sabotage", "note"];
  const doomerAbilities = ["chat", "dm", "proposeCollab", "collab", "vote", "defend", "heal", "invisibleSabotage", "attack", "note"];

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

  const abilityGlow = {
    defend: "drop-shadow(0 0 18px rgba(59,130,246,0.9))",   // blue
    heal: "drop-shadow(0 0 18px rgba(34,197,94,0.9))",     // green
    sabotage: "drop-shadow(0 0 18px rgba(249,115,22,0.9))", // red
    invisibleSabotage: "drop-shadow(0 0 18px rgba(168,85,247,0.9))", // red
    attack: "drop-shadow(0 0 18px rgba(239,68,68,0.9))",   // red
  };

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

  const clearDmTimers = (timerObj) => {
    if (!timerObj) return;
    try {
      if (timerObj.timeout) clearTimeout(timerObj.timeout);
      if (timerObj.interval) clearInterval(timerObj.interval);
    } catch (e) {
      console.log(e);
    }
  };

  const startDmRequest = ({ from, to }) => {
    // If there's already an active DM request, clear it first
    if (dmTimer) {
      clearDmTimers(dmTimer);
      setDmTimer(null);
    }

    setDmCountdown(10);
    let secondsLeft = 10;

    const interval = setInterval(() => {
      secondsLeft -= 1;
      setDmCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    const timeout = setTimeout(() => {
      // expire
      setDmRequest(null);
      setSelectingDmTarget(false);
      clearInterval(interval);
      setDmTimer(null);
    }, 10000);

    setDmTimer({ timeout, interval });
    setDmRequest({ from, to, expiresAt: Date.now() + 10000 });
  };

  const clearCollabTimers = (timerObj) => {
    if(!timerObj) return;
    try {
      if(timerObj.timeout) clearTimeout(timerObj.timeout);
      if(timerObj.interval) clearInterval(timerObj.interval);
    } catch(e) {
      console.log(e);
    }
  };

  const startCollabRequest = ({ from }) => {
    if(collabTimer) {
      clearCollabTimers(collabTimer);
      setCollabTimer(null);
    }

    setCollabCountdown(10);
    let secondsLeft = 10;

    const interval = setInterval(() => {
      secondsLeft -= 1;
      setCollabCountdown(secondsLeft);
      if(secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    const timeout = setTimeout(() => {
      setCollabRequest(null);
      clearInterval(interval);
      setCollabTimer(null);
    }, 10000);

    setCollabTimer({ timeout, interval });
    setCollabRequest({ from, startedAt: Date.now(), expiresAt: Date.now() + 10000});
  }

  useEffect(() => {
    return () => {
      clearDmTimers(dmTimer);
      clearCollabTimers(collabTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    console.log("ABILITY VOTES UPDATED:", abilityVotes);
  }, [abilityVotes]);

  return (
    <div style={backgroundStyle}>
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid white",
              color: "white",
              fontSize: "18px",
              padding: "12px 20px",
              borderRadius: "12px",
            },
            iconTheme: {
              primary: "#4ade80", // Same green as your Accept button (Tailwind green-400)
              secondary: "white",
            },
          },
          error: {
            style: {
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid white",
              color: "white",
              fontSize: "18px",
              padding: "12px 20px",
              borderRadius: "12px",
            },
            iconTheme: {
              primary: "#f87171", // red-400
              secondary: "white",
            },
          },
        }}
      />


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
            filter: selectingAbility === "defend"
              ? abilityGlow.defend
              : "none",
            cursor: selectingAbility === "defend"
              ? "pointer"
              : "default",
            transition: "filter 0.2s ease, transform 0.2s ease",
          }}
          onClick={() => {
            // Only allow self-target for DEFEND
            if (selectingAbility !== "defend") return;

            setAbilityVotes(prev => ({
              ...prev,
              [playerCharacter]: {
                ability: "defend",
                target: playerCharacter,
              },
            }));

            setSelectingAbility(null);
          }}
      />

      {/* Other Characters */}
      {characterPositions.map((pos, i) => {
        const isAbiltiyTargeting = Boolean(selectingAbility);

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
                    filter:
                      isAbiltiyTargeting
                      ? abilityGlow[selectingAbility] 
                      : selectingDmTarget 
                      ? "drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))" 
                      : "none",
                    cursor: isAbiltiyTargeting || selectingDmTarget ? "pointer" : "default",
                    transition: "filter 0.2s ease, border 0.2s ease, transform 0.2s ease",
                }}
                onClick={() => {
                  if(selectingAbility) {
                    setAbilityVotes(prev => ({
                      ...prev,
                      [playerCharacter]: {
                        ability: selectingAbility,
                        target: otherCharacters[i],
                      }
                    }));
                    setSelectingAbility(null);
                    return;
                  }

                  // only start DM when selecting target is active
                  if (!selectingDmTarget) return;

                  // ensure previous DM timers are cleared
                  if (dmTimer) {
                    clearDmTimers(dmTimer);
                    setDmTimer(null);
                  }

                  startDmRequest({ from: playerCharacter, to: otherCharacters[i] });

                  // stop selecting target
                  setSelectingDmTarget(false);
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

      {/* Chat */}
      {chat && (
        <GameChat playerColor="red" onClose={() => setChat(false)}/>
      )}  

      {dm && (
        <Dm playerColor="red" onClose={() => setDm(false)}/>
      )}
      {dmRequest && (
        <DmRequest 
          dmCountdown={dmCountdown} 
          dmRequest={dmRequest} 
          dmTimer={dmTimer} 
          setDmRequest={(val) => {
            // clear timers when dismissed externally
            if (!val) {
              clearDmTimers(dmTimer);
              setDmTimer(null);
            }
            setDmRequest(val);
          }}
          setDm={(v) => setDm(v)}
          playerColor="red"
        />
      )}

      {collabRequest && (
        <CollabRequest collabRequest={collabRequest} playerCharacter={playerCharacter} collabCountdown={collabCountdown} collabTimer={collabTimer} clearCollabTimers={clearCollabTimers} setCollabTimer={setCollabTimer} setCollabRequest={setCollabRequest} />
      )}

      {collab && (
        <CollabVote playerColor={"red"} onClose={() => setCollab(false)}/>
      )}
      
      {vote && (
        <Vote playerColor={"red"} onClose={() => setVote(false)}/>
      )}
      
      {note && (
        <Note playerColor={"red"} onClose={() => setNote(false)}/>
      )}

      {selectingDmTarget && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-2xl z-50">
          Select target to <span className="font-bold">Request DM</span>
        </div>
      )}
      {selectingAbility && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-2xl z-50">
          Select target to <span className="font-bold">{selectingAbility.toUpperCase()}</span>
        </div>
      )}

      {/* Abilities buttons */}
      <div className="absolute bottom-0 w-full h-50 bg-transparent z-4 flex justify-center items-center gap-2">
        {(doomer ? doomerAbilities : viberAbilities).map((name, i) => {
          const isChatButton = name === "chat";
          const isDmButton = name === "dm";
          const isProposeButton = name === "proposeCollab";
          const isCollabButton = name === "collab";
          const isVoteButton = name === "vote";
          const isNoteButton = name === "note";

          return (
            <button
              key={i}
              className="w-30 h-30 rounded-full bg-black opacity-80 border-white border-2 flex items-center justify-center flex flex-col cursor-pointer transition-all duration-500 hover:scale-110 hover:opacity-100 active:scale-95 active:opacity-100"
              onClick={() => {
                if (isChatButton) {
                  setChat(prev => !prev); // toggle chat panel
                } else if(isDmButton) {
                  setSelectingDmTarget(prev => !prev);
                } else if(isProposeButton) {
                  if(collabRequest) return;
                  startCollabRequest({ from: playerCharacter });
                } else if(isCollabButton) {
                  setCollab(prev => !prev);
                } else if (["defend", "heal", "sabotage", "invisibleSabotage", "attack"].includes(name)) {
                  setSelectingAbility(prev => (prev === name ? null : name));
                } else if(isVoteButton) {
                  setVote(prev => !prev);
                } else if(isNoteButton) {
                  setNote(prev => !prev);
                }
                // Other abilities can have their own handlers here
              }}
            >
              <img src={`/images/${name}.png`} alt={`ability ${i}`} className="w-10 h-10" />
              <p className={`text-white ${hasMultipleWords(name) ? 'text-md' : 'text-xl'}`}>{formatAbilityName(name)}</p>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default GameplayPage;
