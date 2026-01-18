import { handleBotPhase, initializeBots } from "../ai/botController.js";
import { createGame, updateGame } from "../game/gameManager.js";
import { startPhaseTimer } from "../game/phaseManager.js";

const activeLobbies = new Map();

export const registerMatchmakingSockets = (io, socket) => {
  // Get list of available games
  socket.on("get-games-list", () => {
    const gamesList = Array.from(activeLobbies.values()).map((lobby) => ({
      id: lobby.gameId,
      hostName: lobby.hostName,
      hostColor: lobby.hostColor,
      playerCount: lobby.players.length,
      takenColors: lobby.players.map((p) => p.color),
      createdAt: lobby.createdAt,
      status: lobby.status,
    }));

    socket.emit("games-list", gamesList);
  });

  // Create a new game
  socket.on("create-game", ({ gameId, hostName, hostColor }) => {
    console.log("Creating game:", { gameId, hostName, hostColor });

    // Create lobby
    const lobby = {
      gameId,
      hostId: socket.id,
      hostName,
      hostColor,
      players: [
        {
          id: socket.id,
          name: hostName,
          color: hostColor,
          isHost: true,
          isBot: false,
        },
      ],
      status: "waiting", // waiting, started
      createdAt: Date.now(),
    };

    activeLobbies.set(gameId, lobby);

    // Join the socket room
    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.data.playerColor = hostColor;
    socket.data.playerName = hostName;
    socket.data.isHost = true;

    // Emit success
    socket.emit("game-created", {
      success: true,
      gameId,
      lobby,
    });

    // Broadcast updated game list to everyone
    io.emit("games-list-updated");

    console.log(`Game ${gameId} created by ${hostName}`);
  });

  // Join an existing game
  socket.on("join-game", ({ gameId, playerName, playerColor }) => {
    console.log("Player joining:", { gameId, playerName, playerColor });

    const lobby = activeLobbies.get(gameId);

    if (!lobby) {
      socket.emit("error", { message: "Game not found!" });
      return;
    }

    if (lobby.status === "started") {
      socket.emit("error", { message: "Game already started!" });
      return;
    }

    if (lobby.players.length >= 8) {
      socket.emit("error", { message: "Game is full!" });
      return;
    }

    // Check if color is taken
    if (lobby.players.some((p) => p.color === playerColor)) {
      socket.emit("error", { message: `${playerColor} is already taken!` });
      return;
    }

    // Add player to lobby
    const newPlayer = {
      id: socket.id,
      name: playerName,
      color: playerColor,
      isHost: false,
      isBot: false,
    };

    lobby.players.push(newPlayer);

    // Join socket room
    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.data.playerColor = playerColor;
    socket.data.playerName = playerName;
    socket.data.isHost = false;

    // Notify the joining player
    socket.emit("game-joined", {
      success: true,
      gameId,
      lobby,
    });

    // Notify all players in the lobby with complete updated player list
    io.to(gameId).emit("player-joined-lobby", {
      player: newPlayer,
      players: lobby.players,
      totalPlayers: lobby.players.length,
    });

    // Broadcast updated game list
    io.emit("games-list-updated");

    console.log(`${playerName} joined game ${gameId}`);
  });

  // Player change color in lobby
  socket.on("change-color", ({ gameId, newColor }) => {
    const lobby = activeLobbies.get(gameId);

    if (!lobby) return;

    const player = lobby.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Check if color is taken
    if (lobby.players.some((p) => p.color === newColor && p.id !== socket.id)) {
      socket.emit("error", { message: `${newColor} is already taken!` });
      return;
    }

    const oldColor = player.color;
    player.color = newColor;
    socket.data.playerColor = newColor;

    // Notify all players in lobby
    io.to(gameId).emit("player-color-changed", {
      playerId: socket.id,
      playerName: player.name,
      oldColor,
      newColor,
    });

    // Broadcast updated games list
    io.emit("games-list-updated");
  });

  // Start the game (host only)
  socket.on("start-game", ({ gameId }) => {
    try {
      console.log("🎮 MATCHMAKING start-game called for:", gameId);
      console.log("🎮 Active lobbies:", Array.from(activeLobbies.keys()));
      const lobby = activeLobbies.get(gameId);

      if (!lobby) {
        console.log("❌ Lobby not found in activeLobbies!");
        socket.emit("error", { message: "Game not found!" });
        return;
      }
      console.log("✅ Lobby found:", lobby);
      console.log("🔍 Socket ID:", socket.id);
      console.log("🔍 Host ID:", lobby.hostId);

      if (socket.id !== lobby.hostId) {
        console.log("❌ Not the host!");
        socket.emit("error", { message: "Only the host can start the game!" });
        return;
      }

      // AUTO-ADD BOTS FOR TESTING (IF LESS THAN 2 PLAYERS)
      const botColors = [
        "red",
        "blue",
        "green",
        "pink",
        "orange",
        "yellow",
        "black",
        "white",
        "purple",
        "brown",
        "cyan",
        "lime",
        "maroon",
        "rose",
        "banana",
        "gray",
        "tan",
        "coral",
      ];

      while (lobby.players.length < 8) {
        const availableColor = botColors.find(
          (c) => !lobby.players.some((p) => p.color === c),
        );
        if (!availableColor) break;

        lobby.players.push({
          id: `bot-${Date.now()}-${Math.random()}`,
          name: `Bot ${lobby.players.length}`,
          color: availableColor,
          isHost: false,
          isBot: true,
        });

        console.log(`Added bot player: ${availableColor}`);
      }
      console.log(
        `Added ${lobby.players.length} total players (including bots)`,
      );

      // Mark lobby as started
      lobby.status = "started";

      // Create actual game state
      const game = createGame(
        gameId,
        lobby.players.map((p) => ({
          id: p.color,
          color: p.color,
          name: p.name,
          isBot: p.isBot,
        })),
      );

      // Initialize bots personalities
      updateGame(gameId, (g) => {
        initializeBots(g);

        // Set initial phase
        g.phase = "COLLAB_PROPOSAL";
        g.phaseTimer = Date.now() + 60000;

        // Log bot personalities
        g.players.forEach((player) => {
          if (player.isBot) {
            console.log(
              `🤖 ${player.name} (${player.color}) - Personality: ${player.personality || "unknown"}`,
            );
          }
        });
      });

      // Notify all players to transition to gameplay
      io.to(gameId).emit("game-starting", {
        gameId,
        players: lobby.players,
      });

      // Start the phase timer
      //   startPhaseTimer(io, gameId, "COLLAB_PROPOSAL", 60000);

      // Trigger bot actions for the first phase
      setTimeout(() => {
        console.log("🤖 Triggering initial bot phase...");
        // handleBotPhase(io, gameId, "COLLAB_PROPOSAL");
      }, 2000);

      // Remove from active lobbies after a short delay
      setTimeout(() => {
        activeLobbies.delete(gameId);
        io.emit("games-list-updated");
      }, 2000);

      console.log(
        `Game ${gameId} started with ${lobby.players.length} players`,
      );
    } catch (error) {
      console.error("❌ Error starting game:", error);
      socket.emit("error", {
        message: "Failed to start game:" + error.message,
      });
    }
  });

  // Leave lobby
  socket.on("leave-lobby", ({ gameId }) => {
    handlePlayerLeave(io, socket, gameId);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const gameId = socket.data.gameId;
    if (gameId) {
      handlePlayerLeave(io, socket, gameId);
    }
  });
};

// Helper function to handle players leaving
function handlePlayerLeave(io, socket, gameId) {
  const lobby = activeLobbies.get(gameId);
  if (!lobby) return;

  const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);
  if (playerIndex === -1) return;

  const player = lobby.players[playerIndex];
  lobby.players.splice(playerIndex, 1);

  // If host left, assign new host or delete lobby
  if (socket.id === lobby.hostId) {
    if (lobby.players.length > 0) {
      // Assign new host
      const newHost = lobby.players[0];
      lobby.hostId = newHost.id;
      newHost.isHost = true;
      lobby.hostName = newHost.name;
      lobby.hostColor = newHost.color;

      io.to(gameId).emit("new-host", {
        hostId: newHost.id,
        hostName: newHost.name,
        hostColor: newHost.color,
      });
    } else {
      // Delete empty lobby
      activeLobbies.delete(gameId);
    }
  }

  // Notify remaining players with complete updated player list
  io.to(gameId).emit("player-left-lobby", {
    playerId: socket.id,
    playerName: player.name,
    playerColor: player.color,
    remainingPlayers: lobby.players.length,
    players: lobby.players,
  });

  // Broadcast game list
  io.emit("games-list-updated");

  socket.leave(gameId);
  console.log(`${player.name} left game ${gameId}`);
}
