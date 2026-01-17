import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import BackgroundImage from "/images/gameplayBackground.png";
import GameChat from "../components/GameChat";
import { useLocation, useNavigate } from "react-router-dom";
import RightPanels from "../components/RightPanels";
import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

const LobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  // Get lobby info from navigation state
  const {
    gameId,
    playerColor: initialColor,
    playerName,
    isHost,
    initialLobbyPlayers = [],
  } = location.state || {};

  // const [socket, setSocket] = useState(null);
  const [playerColor, setPlayerColor] = useState(initialColor || "red");
  const [chat, setChat] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState(initialLobbyPlayers);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingPlayers, setTypingPlayers] = useState(new Set());

  const allColors = [
    { name: "red", hex: "#ef4444" },
    { name: "blue", hex: "#3b82f6" },
    { name: "green", hex: "#22c55e" },
    { name: "pink", hex: "#ec4899" },
    { name: "orange", hex: "#f97316" },
    { name: "yellow", hex: "#eab308" },
    { name: "black", hex: "#000000" },
    { name: "white", hex: "#ffffff" },
    { name: "purple", hex: "#a855f7" },
    { name: "brown", hex: "#92400e" },
    { name: "cyan", hex: "#06b6d4" },
    { name: "lime", hex: "#84cc16" },
    { name: "maroon", hex: "#7f1d1d" },
    { name: "rose", hex: "#fb7185" },
    { name: "banana", hex: "#fef08a" },
    { name: "gray", hex: "#6b7280" },
    { name: "tan", hex: "#d2b48c" },
    { name: "coral", hex: "#ff7f50" },
  ];

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

  useEffect(() => {
    if (!gameId) {
      toast.error("No game ID found! Redirecting...");
      navigate("/matchmaking");
      return;
    }

    if (!socket) return;

    let isComponentMounted = true;

    const handlePlayerJoinedLobby = (data) => {
      toast.success(`${data.player.name} joined the lobby!`);
      // Update with complete player list from server to ensure all players are visible
      setLobbyPlayers(data.players || [data.player]);
    };
    const handlePlayerLeftLobby = (data) => {
      toast.error(`${data.playerName} left the lobby`);
      // Update with complete player list from server
      setLobbyPlayers(data.players || []);
    };
    const handleNewHost = (data) => {
      toast.success(`${data.hostName} is now the host!`);
    };
    const handlePlayerColorChanged = (data) => {
      setLobbyPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId ? { ...p, color: data.newColor } : p,
        ),
      );
    };
    const handleStartGameplay = () => {
      toast.success("Game is starting!");

      // If we are the host, trigger the gameplay start on the game socket
      if (isHost && socket && gameId) {
        socket.emit("start-gameplay", { gameId });
      }

      setTimeout(() => {
        navigate("/gameplay", {
          state: {
            gameId,
            playerColor,
            playerName,
            initialLobbyPlayers: lobbyPlayers,
          },
        });
      }, 2000);
    };
    const handleMessageReceived = (data) => {
      setChatMessages((prev) => [...prev, data]);
    };
    const handlePlayerTyping = (data) => {
      if (data.isTyping) {
        setTypingPlayers((prev) => new Set([...prev, data.playerColor]));
      } else {
        setTypingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(data.playerColor);
          return next;
        });
      }
    };
    const handleError = (error) => {
      toast.error(error.message);
    };

    socket.on("player-joined-lobby", handlePlayerJoinedLobby);
    socket.on("player-left-lobby", handlePlayerLeftLobby);
    socket.on("new-host", handleNewHost);
    socket.on("player-color-changed", handlePlayerColorChanged);
    socket.on("game-starting", handleStartGameplay);
    socket.on("message-received", handleMessageReceived);
    socket.on("player-typing", handlePlayerTyping);
    socket.on("error", handleError);

    return () => {
      isComponentMounted = false;

      socket.off("player-joined-lobby", handlePlayerJoinedLobby);
      socket.off("player-left-lobby", handlePlayerLeftLobby);
      socket.off("new-host", handleNewHost);
      socket.off("player-color-changed", handlePlayerColorChanged);
      socket.off("game-starting", handleStartGameplay);
      socket.off("message-received", handleMessageReceived);
      socket.off("player-typing", handlePlayerTyping);
      socket.off("error", handleError);
    };
  }, [socket, gameId, navigate, playerName, playerColor]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket && gameId) {
        socket.emit("leave-lobby", { gameId });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket, gameId]);

  // Get list of taken colors from other players
  const takenColors = lobbyPlayers.map((p) => p.color);

  // Handle color selection
  const handleColorSelect = (colorName) => {
    if (takenColors.includes(colorName)) {
      toast.error(`${colorName} is already taken!`);
      return;
    }

    if (colorName === playerColor) {
      return; // Already selected
    }

    setPlayerColor(colorName);
    toast.success(`Color changed to ${colorName}!`);

    // Emit color change to server
    if (socket && gameId) {
      socket.emit("change-color", { gameId, newColor: colorName });
    }
  };

  const handleStartGame = () => {
    if (!isHost) {
      toast.error("Only the host can start the game!");
      return;
    }

    if (socket && gameId) {
      socket.emit("start-game", { gameId });
    }
  };

  const sendMessage = (message) => {
    if (socket && gameId && playerColor) {
      socket.emit("send-message", {
        gameId,
        message,
        senderColor: playerColor,
      });
    }
  };

  const setTyping = (isTyping) => {
    if (socket && gameId && playerColor) {
      socket.emit("typing", {
        gameId,
        playerColor,
        isTyping,
      });
    }
  };

  // Get other players (excluding self)
  const otherPlayers = lobbyPlayers.filter((p) => p.color !== playerColor);

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
              primary: "#4ade80",
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
              primary: "#f87171",
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
        }}
      />

      {/* Other Characters */}
      {characterPositions.slice(0, otherPlayers.length).map((pos, i) => {
        const player = otherPlayers[i];

        let imageSrc = `/images/characters/${player.color}.png`;
        if (i === 3) {
          imageSrc = `/images/charactersFront/${player.color}.png`;
        }

        return (
          <img
            key={player.id}
            src={imageSrc}
            alt={`player-${player.color}`}
            style={{
              position: "absolute",
              width: `${i === 0 || i === 6 ? "128px" : i === 1 || i === 5 ? "120px" : "112px"}`,
              ...pos,
              transform: `translate(-50%, -50%) ${i < 3 ? "scaleX(-1)" : ""}`,
              zIndex: 1,
            }}
          />
        );
      })}

      {isHost ? (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-2xl z-50">
          Click <span className="font-bold">Start</span> when you're ready
        </div>
      ) : (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-2xl z-50">
          Waiting for Lobby Host to <span className="font-bold">Start</span>
        </div>
      )}

      {/* Lobby Info */}
      <div className="absolute w-80 top-5 left-5 rounded-3xl bg-black/30 backdrop-blur-md border-white border-2 flex flex-col justify-center items-center p-4">
        <p className="text-2xl text-white">Waiting for players...</p>
        <p className="text-2xl text-white mt-2">
          <span className="font-bold">{lobbyPlayers.length}/8</span> Players
        </p>
        {isHost && (
          <p className="text-2xl text-green-400 mt-2 font-bold">
            👑 You are the host
          </p>
        )}
        <p className="text-2xl text-white/60 mt-2">
          Game ID: {gameId?.substring(5, 17)}
        </p>
      </div>

      {/* Color Selection Panel */}
      <div className="absolute left-5 top-60 w-80 bg-black/30 backdrop-blur-md border-white border-2 rounded-3xl flex flex-col p-5 gap-3">
        <h3 className="text-white text-xl font-bold text-center mb-2">
          Select Your Color
        </h3>

        <div className="grid grid-cols-6 gap-3">
          {allColors.map((color, i) => {
            const isTaken = takenColors.includes(color.name);
            const isSelected = playerColor === color.name;

            return (
              <button
                key={i}
                onClick={() => handleColorSelect(color.name)}
                disabled={isTaken}
                className={`
                  w-12 h-12 rounded-full relative
                  transition-all duration-300
                  ${isTaken ? "opacity-40 cursor-not-allowed" : "hover:scale-110 cursor-pointer"}
                  ${isSelected ? "ring-4 ring-white scale-110" : ""}
                `}
                style={{
                  backgroundColor: color.hex,
                  border:
                    color.name === "white"
                      ? "2px solid #gray"
                      : "2px solid white",
                }}
                title={color.name}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-2xl"
                      style={{
                        color:
                          color.name === "white" ||
                          color.name === "yellow" ||
                          color.name === "banana"
                            ? "black"
                            : "white",
                      }}
                    >
                      ✓
                    </span>
                  </div>
                )}

                {/* Taken X mark */}
                {isTaken && !isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl text-red-500 font-bold">✕</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="text-white/70 text-sm text-center mt-2">
          <p>✓ Your color</p>
          <p>✕ Taken by others</p>
        </div>
      </div>

      {/* Right panels */}
      <RightPanels
        playerCharacter={playerColor}
        otherPlayers={otherPlayers}
        myPlayer={{
          id: playerColor,
          color: playerColor,
          isHost,
        }}
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

      {/* Bottom Buttons */}
      <div className="absolute bottom-4 w-full flex justify-center items-center gap-4 z-10">
        <button
          className="w-28 h-28 rounded-full bg-black/80 border-white border-2 flex items-center justify-center flex-col cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-black/90 active:scale-95"
          onClick={() => setChat((prev) => !prev)}
        >
          <img src="/images/chat.png" alt="chat" className="w-10 h-10" />
          <p className="text-white text-lg mt-1">CHAT</p>
        </button>

        {isHost && (
          <button
            className="w-28 h-28 rounded-full bg-green-600/80 border-white border-2 flex items-center justify-center flex-col cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-green-600 active:scale-95"
            onClick={handleStartGame}
            // disabled={lobbyPlayers.length < 1}
          >
            <img src="/images/start.png" alt="start" className="w-10 h-10" />
            <p className="text-white text-lg mt-1 font-bold">START</p>
          </button>
        )}

        <button
          className="w-28 h-28 rounded-full bg-red-600/80 border-white border-2 flex items-center justify-center flex-col cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-red-600 active:scale-95"
          onClick={() => {
            if (socket && gameId) {
              socket.emit("leave-lobby", { gameId });
            }
            navigate("/matchmaking");
          }}
        >
          <img src="/images/leave.png" alt="leave" className="w-10 h-10" />
          <p className="text-white text-lg mt-1">LEAVE</p>
        </button>
      </div>
    </div>
  );
};

export default LobbyPage;
