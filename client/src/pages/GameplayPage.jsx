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
import GameStartModal from "../components/GameStartModal";
import { AnimatePresence } from "framer-motion";
import LeftPanels from "../components/LeftPanels";
import RightPanels from "../components/RightPanels";
import { useGameSocket } from "../hooks/useGameSocket";
import { useChatSocket } from "../hooks/useChatSocket";
import { useDmSocket } from "../hooks/useDmSocket";
import PhaseTimer from "../components/PhaseTimer";
import EventDisplay from "../components/EventDisplay";
import { io } from "socket.io-client";

const GameplayPage = () => {
  // Game setup
  const gameId = "game-123";
  const playerColor = "red";

  // Socket hooks
  const {
    phase,
    round,
    phaseTimer,
    myPlayer,
    otherPlayers,
    currentEvent,
    collabProposals,
    proposeCollab,
    voteCollab,
    submitAbility,
    submitVote,
    saveNote,
  } = useGameSocket(gameId, playerColor);

  const socket = io('http://localhost:3001');

  const {
    dmRequests,
    activeDm,
    dmMessages,
    requestDm,
    acceptDm,
    rejectDm,
    sendDmMessage,
    leaveDm
  } = useDmSocket(socket, gameId, playerColor);

  const {
    messages: chatMessages,
    typingPlayers,
    sendMessage,
    setTyping
  } = useChatSocket(socket, gameId, playerColor);

  // const [doomer, setDoomer] = useState(true);
  // const [showGameStart, setShowGameStart] = useState(true);
  // const [chat, setChat] = useState(false);
  // const [dm, setDm] = useState(false);
  // const [selectingDmTarget, setSelectingDmTarget] = useState(false);

  // const [dmRequest, setDmRequest] = useState(null);
  // const [dmTimer, setDmTimer] = useState(null);
  // const [dmCountdown, setDmCountdown] = useState(10);

  // const [collabRequest, setCollabRequest] = useState(null);
  // const [collabCountdown, setCollabCountdown] = useState(10);
  // const [collabTimer, setCollabTimer] = useState(null);

  // const [collab, setCollab] = useState(false);
  // const [vote, setVote] = useState(false);
  // const [note, setNote] = useState(false);

  // const [selectingAbility, setSelectingAbility] = useState(null);
  // const [abilityVotes, setAbilityVotes] = useState({});
  const [showGameStart, setShowGameStart] = useState(true);
  const [chat, setChat] = useState(false);
  const [dm, setDm] = useState(false);
  const [selectingDmTarget, setSelectingDmTarget] = useState(false);
  const [collab, setCollab] = useState(false);
  const [vote, setVote] = useState(false);
  const [note, setNote] = useState(false);
  const [selectingAbility, setSelectingAbility] = useState(null);

  // const characterColors = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white", "purple", "brown", "cyan", "lime", "maroon", "rose", "banana", "gray", "tan", "coral"];
  const characterColors = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white"];
  const viberAbilities = ["chat", "dm", "proposeCollab", "collab", "vote", "defend", "heal", "sabotage", "note"];
  const doomerAbilities = ["chat", "dm", "proposeCollab", "collab", "vote", "defend", "heal", "invisibleSabotage", "attack", "note"];

  // const playerCharacter = characterColors[0];
  // const otherCharacters = characterColors.slice(1);
  const abilities = myPlayer?.role === "doomer" ? doomerAbilities : viberAbilities;

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

  // const clearDmTimers = (timerObj) => {
  //   if (!timerObj) return;
  //   try {
  //     if (timerObj.timeout) clearTimeout(timerObj.timeout);
  //     if (timerObj.interval) clearInterval(timerObj.interval);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  // const startDmRequest = ({ from, to }) => {
  //   // If there's already an active DM request, clear it first
  //   if (dmTimer) {
  //     clearDmTimers(dmTimer);
  //     setDmTimer(null);
  //   }

  //   setDmCountdown(10);
  //   let secondsLeft = 10;

  //   const interval = setInterval(() => {
  //     secondsLeft -= 1;
  //     setDmCountdown(secondsLeft);
  //     if (secondsLeft <= 0) {
  //       clearInterval(interval);
  //     }
  //   }, 1000);

  //   const timeout = setTimeout(() => {
  //     // expire
  //     setDmRequest(null);
  //     setSelectingDmTarget(false);
  //     clearInterval(interval);
  //     setDmTimer(null);
  //   }, 10000);

  //   setDmTimer({ timeout, interval });
  //   setDmRequest({ from, to, expiresAt: Date.now() + 10000 });
  // };

  // const clearCollabTimers = (timerObj) => {
  //   if(!timerObj) return;
  //   try {
  //     if(timerObj.timeout) clearTimeout(timerObj.timeout);
  //     if(timerObj.interval) clearInterval(timerObj.interval);
  //   } catch(e) {
  //     console.log(e);
  //   }
  // };

  // const startCollabRequest = ({ from }) => {
  //   if(collabTimer) {
  //     clearCollabTimers(collabTimer);
  //     setCollabTimer(null);
  //   }

  //   setCollabCountdown(10);
  //   let secondsLeft = 10;

  //   const interval = setInterval(() => {
  //     secondsLeft -= 1;
  //     setCollabCountdown(secondsLeft);
  //     if(secondsLeft <= 0) {
  //       clearInterval(interval);
  //     }
  //   }, 1000);

  //   const timeout = setTimeout(() => {
  //     setCollabRequest(null);
  //     clearInterval(interval);
  //     setCollabTimer(null);
  //   }, 10000);

  //   setCollabTimer({ timeout, interval });
  //   setCollabRequest({ from, startedAt: Date.now(), expiresAt: Date.now() + 10000});
  // }

  // useEffect(() => {
  //   return () => {
  //     clearDmTimers(dmTimer);
  //     clearCollabTimers(collabTimer);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  // useEffect(() => {
  //   console.log("ABILITY VOTES UPDATED:", abilityVotes);
  // }, [abilityVotes]);

  const handleAbilityClick = (abilityName) => {
    if(abilityName === "chat") {
      setChat(prev => !prev);
    } else if(abilityName === "dm") {
      setSelectingDmTarget(prev => !prev);
    } else if(abilityName === "proposeCollab") {
      proposeCollab();
    } else if(abilityName === "collab") {
      setCollab(prev => !prev);
    } else if(["defend", "heal", "sabotage", "invisibleSabotage", "attack"].includes(abilityName)) {
      setSelectingAbility(prev => (prev === abilityName ? null : abilityName));
    } else if(abilityName === "vote") {
      setVote(prev => !prev);
    } else if(abilityName === "note") {
      setNote(prev => !prev);
    }
  };

  const handleCharacterClick = (targetColor) => {
    if(selectingAbility) {
      submitAbility(selectingAbility, targetColor);
      setSelectingAbility(null);
    } else if(selectingDmTarget) {
      requestDm(targetColor);
      setSelectingDmTarget(false);
    }
  };

  if(!myPlayer) {
    return <div>Loading...</div>;
  }

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

      {/* Phase timer */}
      {phaseTimer && (
        <PhaseTimer 
          endTime={phaseTimer}
          phase={phase}
          round={round}
        />
      )}

      {/* Event display */}
      {currentEvent && (
        <EventDisplay event={currentEvent} />
      )}

      {/* Game starting modal */}
      <AnimatePresence>
        {showGameStart && (
          <GameStartModal 
            playerColor={playerColor} 
            role={myPlayer.role} 
            allColors={otherPlayers.map(p => p.color)}
            onClose={() => setShowGameStart(false)}
          />
        )}
      </AnimatePresence>
      
      
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
          src={`/images/charactersBack/${playerColor}.png`}
          alt="player"
          style={{
            position: "absolute",
            width: "200px",
            left: "50%",
            top: "52%",
            transform: "translateX(-50%)",
            zIndex: 3,
            filter: selectingAbility === "defend" ? abilityGlow.defend : "none",
            cursor: selectingAbility === "defend" ? "pointer" : "default",
            transition: "filter 0.2s ease, transform 0.2s ease",
          }}
          onClick={() => {
            if(selectingAbility === "defend") {
              submitAbility("defend", playerColor);
              setSelectingAbility(null);
            }
          }}
      />

      {/* Other Characters */}
      {characterPositions.slice(0, otherPlayers.length).map((pos, i) => {
        const player = otherPlayers[i];
        const isTargeting = Boolean(selectingAbility) || selectingDmTarget;

        let imageSrc = `/images/characters/${player.color}.png`
        if(i === 3) {
            imageSrc = `images/charactersFront/${player.color}.png`
        }
        
        return (
            <img
              key={player.id}
              src={imageSrc}
              alt={`player-${player.color}`}
              style={{
                  position: "absolute",
                  width: `${i === 0 || i=== 6 ? "160px" : i === 1 || i === 5 ? "150px" : "140px"}`,
                  ...pos,
                  transform: `translate(-50%, -50%) ${i < 3 ? "scaleX(-1)" : ""}`,
                  zIndex: 1,
                  filter: isTargeting
                    ? selectingAbility
                      ? abilityGlow[selectingAbility] 
                      : "drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))" 
                    : "none",
                  cursor: isTargeting ? "pointer" : "default",
                  transition: "filter 0.2s ease, border 0.2s ease, transform 0.2s ease",
              }}
              onClick={() => player.alive && handleCharacterClick(player.color)}
            />
          )
      })}

      {/* Left panels */}
      <LeftPanels 
        playerCharacter={playerColor}
        aura={myPlayer.aura}
        vibe={myPlayer.vibe}
        role={myPlayer.role}
      />

      {/* Right panels */}
      <RightPanels 
        playerCharacter={playerColor}
        otherCharacters={otherPlayers.map(p => p.color)}
      />

      {/* Modals */}
      {chat && (
        <GameChat
          playerColor={playerColor}
          messages={chatMessages}
          typingPlayers={typingPlayers}
          onSendMessage={sendMessage}
          onTyping={setTyping}  
          onClose={() => setChat(false)}
        />
      )}  

      {dm && activeDm && (
        <Dm 
          playerColor={playerColor}
          otherColor={activeDm.from === playerColor ? activeDm.to : activeDm.from}
          messages={dmMessages}
          onSendMessage={sendDmMessage} 
          onClose={() => {
            leaveDm();
            setDm(false)
          }}
        />
      )}
      {dmRequests.map((request, i) => (
        <DmRequest 
          key={i}
          dmRequest={request}
          onAccept={() => {
            acceptDm(request);
            setDm(true);
          }}
          onReject={() => rejectDm(request)}
          playerColor={playerColor}
        />
      ))}

      {collab && phase === 'COLLAB_VOTING' && (
        <CollabVote 
          playerColor={playerColor}
          proposals={collabProposals}
          onVote={voteCollab}
          onClose={() => setCollab(false)}
        />
      )}
      
      {vote && (
        <Vote 
          playerColor={playerColor}
          players={otherPlayers.filter(p => p.alive)}
          onSubmitVote={submitVote} 
          onClose={() => setVote(false)}
        />
      )}
      
      {note && (
        <Note 
          playerColor={playerColor}
          initialNote={myPlayer.note}
          onSave={saveNote} 
          onClose={() => setNote(false)}
        />
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
        {abilities.map((name, i) => (
          <button
            key={i}
            className="w-30 h-30 rounded-full bg-black opacity-80 border-white border-2 flex items-center justify-center flex flex-col cursor-pointer transition-all duration-500 hover:scale-110 hover:opacity-100 active:scale-95 active:opacity-100"
            onClick={() => handleAbilityClick(name)}
            disabled={phase !== "ACTION_PHASE" && !["chat", "dm", "note", "proposeCollab", "collab", "vote"].includes(name)}
          >
            <img src={`/images/${name}.png`} alt={name} className="w-10 h-10" />
            <p className={`text-white ${hasMultipleWords(name) ? 'text-md' : 'text-xl'}`}>
              {formatAbilityName(name)}
            </p>
          </button>
        ))}
      </div>

    </div>
  );
};

export default GameplayPage;
