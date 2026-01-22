import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
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
import { useSocket } from "../contexts/SocketContext";

const GameplayPage = () => {
  // Game setup - read from navigation state (fallback to defaults)
  const location = useLocation();
  const navigate = useNavigate();
  const {
    gameId: navGameId,
    playerColor: navPlayerColor,
    initialLobbyPlayers = [],
    playerName,
  } = location.state || {};
  const gameId = navGameId || "game-123";
  const playerColor = navPlayerColor || "red";

  // Get shared socket from context
  const socket = useSocket();

  // Socket hooks
  const {
    phase,
    round,
    phaseTimer,
    myPlayer,
    otherPlayers,
    currentEvent,
    collabProposals,
    collabHost,
    skipVotes,
    votes,
    gameOverData,
    proposeCollab,
    voteCollab,
    submitAbility,
    submitVote,
    saveNote,
  } = useGameSocket(socket, gameId, playerColor);

  const {
    dmRequests,
    activeDm,
    dmMessages,
    requestDm,
    acceptDm,
    rejectDm,
    sendDmMessage,
    leaveDm,
  } = useDmSocket(socket, gameId, playerColor);

  const {
    messages: chatMessages,
    typingPlayers,
    sendMessage,
    setTyping,
  } = useChatSocket(socket, gameId, playerColor);

  const [showGameStart, setShowGameStart] = useState(true);
  const [chat, setChat] = useState(false);
  const [dm, setDm] = useState(false);
  const [selectingDmTarget, setSelectingDmTarget] = useState(false);
  const [collab, setCollab] = useState(false);
  const [vote, setVote] = useState(false);
  const [note, setNote] = useState(false);
  const [selectingAbility, setSelectingAbility] = useState(null);
  const [collabRequest, setCollabRequest] = useState(null);
  const [collabTimer, setCollabTimer] = useState(null);
  const [collabCountdown, setCollabCountdown] = useState(10);

  const viberAbilities = [
    "chat",
    "dm",
    "proposeCollab",
    "collab",
    "vote",
    "defend",
    "heal",
    "sabotage",
    "note",
  ];
  const doomerAbilities = [
    "chat",
    "dm",
    "proposeCollab",
    "collab",
    "vote",
    "defend",
    "heal",
    "invisibleSabotage",
    "attack",
    "note",
  ];

  const abilities =
    myPlayer?.role === "doomer" ? doomerAbilities : viberAbilities;

  // Redirect to results page when game is over
  useEffect(() => {
    if (gameOverData) {
      // Wait 3 seconds to show the victory/defeat toast, then redirect
      setTimeout(() => {
        navigate("/results", {
          state: {
            winners: gameOverData.winners,
            allPlayers: [myPlayer, ...otherPlayers],
            totalRounds: round,
            gameId: gameId,
          },
        });
      }, 3000);
    }
  }, [gameOverData, navigate, round, myPlayer, otherPlayers, gameId]);

  // Determine which abilities should be visible in the current phase
  const visibleAbilities = (() => {
    const phaseVisibility = {
      COLLAB_PROPOSAL: ["chat", "proposeCollab", "vote", "note"],
      COLLAB_VOTING: ["chat", "collab", "vote", "note"],
      DM_PHASE: ["chat", "dm", "vote", "note"],
      ACTION_PHASE: [
        "chat",
        "vote",
        "defend",
        "heal",
        "sabotage",
        "invisibleSabotage",
        "attack",
        "note",
      ],
    };

    const visibleForPhase = phaseVisibility[phase] || [];
    return abilities.filter((a) => visibleForPhase.includes(a));
  })();

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
    defend: "drop-shadow(0 0 18px rgba(59,130,246,0.9))", // blue
    heal: "drop-shadow(0 0 18px rgba(34,197,94,0.9))", // green
    sabotage: "drop-shadow(0 0 18px rgba(249,115,22,0.9))", // red
    invisibleSabotage: "drop-shadow(0 0 18px rgba(168,85,247,0.9))", // red
    attack: "drop-shadow(0 0 18px rgba(239,68,68,0.9))", // red
  };

  // Split camel case into separate words
  const formatAbilityName = (name) => {
    const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
    if (words.length > 1) {
      return (
        <>
          {words[0].toUpperCase()}
          <br />
          {words.slice(1).join(" ").toUpperCase()}
        </>
      );
    }
    return name.toUpperCase();
  };

  // Check if ability name has multiple words
  const hasMultipleWords = (name) => {
    return /([a-z])([A-Z])/.test(name);
  };

  const clearCollabTimers = (timerId) => {
    if (timerId) clearInterval(timerId);
  };

  const handleAbilityClick = (abilityName) => {
    // Eliminated players can only chat and take notes
    if (!myPlayer.alive && !["chat", "note"].includes(abilityName)) {
      toast.error("You are eliminated and can only chat or take notes!");
      return;
    }

    if (abilityName === "chat") {
      setChat((prev) => !prev);
    } else if (abilityName === "dm") {
      setSelectingDmTarget((prev) => !prev);
    } else if (abilityName === "proposeCollab") {
      // Show collab request confirmation
      setCollabRequest({ from: playerColor });
      setCollabCountdown(10);
      const timerId = setInterval(() => {
        setCollabCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setCollabRequest(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCollabTimer(timerId);
    } else if (abilityName === "collab") {
      setCollab((prev) => !prev);
    } else if (
      ["defend", "heal", "sabotage", "invisibleSabotage", "attack"].includes(
        abilityName,
      )
    ) {
      setSelectingAbility((prev) =>
        prev === abilityName ? null : abilityName,
      );
    } else if (abilityName === "vote") {
      setVote((prev) => !prev);
    } else if (abilityName === "note") {
      setNote((prev) => !prev);
    }
  };

  const handleCharacterClick = (targetColor) => {
    // Eliminated players cannot perform targeting actions
    if (!myPlayer.alive) {
      toast.error("You are eliminated and cannot perform actions!");
      return;
    }

    if (selectingAbility) {
      submitAbility(selectingAbility, targetColor);
      setSelectingAbility(null);
    } else if (selectingDmTarget) {
      // Check if there's already an active DM with this player
      if (
        activeDm &&
        (activeDm.from === targetColor || activeDm.to === targetColor)
      ) {
        // If DM already exists, just open it
        setDm(true);
        setSelectingDmTarget(false);
        toast.success(`Opened DM with ${targetColor}!`);
      } else {
        // Check if there's a pending DM request from this player that we should accept
        const pendingRequest = dmRequests.find(
          (r) => r.from === targetColor && r.to === playerColor,
        );
        if (pendingRequest) {
          // Accept the pending request
          acceptDm(pendingRequest);
          setSelectingDmTarget(false);
          toast.success(`Accepted DM from ${targetColor}!`);
        } else {
          // If no active DM and no pending request, send a new request
          requestDm(targetColor);
          setSelectingDmTarget(false);
          toast.success(`DM request sent to ${targetColor}!`);
        }
      }
    }
  };

  if (!myPlayer) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading lobby...</div>
      </div>
    );
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
        <PhaseTimer endTime={phaseTimer} phase={phase} round={round} />
      )}

      {/* Event display */}
      {/* {currentEvent && (
        <EventDisplay event={currentEvent} />
      )} */}

      {/* Game starting modal */}
      <AnimatePresence>
        {showGameStart && (
          <GameStartModal
            playerColor={playerColor}
            role={myPlayer.role}
            allColors={otherPlayers.map((p) => p.color)}
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
          width: "680px",
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
          width: "160px",
          left: "50%",
          top: "52%",
          transform: "translateX(-50%)",
          zIndex: 3,
          filter: selectingAbility === "defend" ? abilityGlow.defend : "none",
          cursor: selectingAbility === "defend" ? "pointer" : "default",
          transition: "filter 0.2s ease, transform 0.2s ease",
        }}
        onClick={() => {
          if (selectingAbility === "defend") {
            submitAbility("defend", playerColor);
            setSelectingAbility(null);
          }
        }}
      />

      {/* Other Characters */}
      {characterPositions
        .slice(0, otherPlayers.filter((p) => p.alive && !p.eliminated).length)
        .map((pos, i) => {
          const alivePlayers = otherPlayers.filter(
            (p) => p.alive && !p.eliminated,
          );
          const player = alivePlayers[i];
          const isTargeting = Boolean(selectingAbility) || selectingDmTarget;

          let imageSrc = `/images/characters/${player.color}.png`;
          if (i === 3) {
            imageSrc = `images/charactersFront/${player.color}.png`;
          }

          return (
            <img
              key={player.id}
              src={imageSrc}
              alt={`player-${player.color}`}
              style={{
                position: "absolute",
                width: `${
                  i === 0 || i === 6
                    ? "128px"
                    : i === 1 || i === 5
                      ? "120px"
                      : "112px"
                }`,
                ...pos,
                transform: `translate(-50%, -50%) ${i < 3 ? "scaleX(-1)" : ""}`,
                zIndex: 1,
                filter: isTargeting
                  ? selectingAbility
                    ? abilityGlow[selectingAbility]
                    : "drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))"
                  : "none",
                cursor: isTargeting ? "pointer" : "default",
                transition:
                  "filter 0.2s ease, border 0.2s ease, transform 0.2s ease",
              }}
              onClick={() => player.alive && handleCharacterClick(player.color)}
            />
          );
        })}

      {/* Left panels */}
      <LeftPanels
        playerCharacter={playerColor}
        aura={myPlayer.aura}
        vibe={myPlayer.vibe}
        role={myPlayer.role}
        round={round}
        collabHost={collabHost}
        vibeCount={
          [myPlayer, ...otherPlayers].filter(
            (p) => p.role === "viber" && p.alive,
          ).length
        }
        doomerCount={
          [myPlayer, ...otherPlayers].filter(
            (p) => p.role === "doomer" && p.alive,
          ).length
        }
      />

      {/* Right panels - Only visible to collabHost */}
      {playerColor === collabHost && (
        <RightPanels
          playerCharacter={playerColor}
          otherPlayers={otherPlayers}
          myPlayer={myPlayer}
        />
      )}

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
          otherColor={
            activeDm.from === playerColor ? activeDm.to : activeDm.from
          }
          messages={dmMessages}
          onSendMessage={sendDmMessage}
          onClose={() => {
            leaveDm();
            setDm(false);
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

      {collabRequest && (
        <CollabRequest
          collabRequest={collabRequest}
          collabCountdown={collabCountdown}
          playerCharacter={playerColor}
          collabTimer={collabTimer}
          clearCollabTimers={clearCollabTimers}
          setCollabTimer={setCollabTimer}
          setCollabRequest={setCollabRequest}
          onConfirm={proposeCollab}
        />
      )}

      {collab && phase === "COLLAB_VOTING" && (
        <CollabVote
          playerColor={playerColor}
          proposals={collabProposals}
          skipVotes={skipVotes}
          onVote={voteCollab}
          onClose={() => setCollab(false)}
        />
      )}

      {vote && (
        <Vote
          playerColor={playerColor}
          players={[myPlayer, ...otherPlayers].filter((p) => p.alive)}
          votes={votes}
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
          Select target to{" "}
          <span className="font-bold">{selectingAbility.toUpperCase()}</span>
        </div>
      )}

      {/* Abilities buttons */}
      <div className="absolute bottom-0 w-full h-50 bg-transparent z-4 flex justify-center items-center gap-2">
        {visibleAbilities.map((name, i) => {
          const isDisabledForEliminated =
            !myPlayer.alive && !["chat", "note"].includes(name);

          return (
            <button
              key={i}
              className={`w-30 h-30 rounded-full bg-black opacity-80 border-white border-2 flex items-center justify-center flex flex-col cursor-pointer transition-all duration-500 hover:scale-110 hover:opacity-100 active:scale-95 active:opacity-100 ${
                isDisabledForEliminated ? "opacity-30 cursor-not-allowed" : ""
              }`}
              onClick={() => handleAbilityClick(name)}
              disabled={
                isDisabledForEliminated ||
                (phase !== "ACTION_PHASE" &&
                  ![
                    "chat",
                    "dm",
                    "note",
                    "proposeCollab",
                    "collab",
                    "vote",
                  ].includes(name))
              }
            >
              <img
                src={`/images/${name}.png`}
                alt={name}
                className="w-10 h-10"
              />
              <p
                className={`text-white ${
                  hasMultipleWords(name) ? "text-md" : "text-xl"
                }`}
              >
                {formatAbilityName(name)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameplayPage;
