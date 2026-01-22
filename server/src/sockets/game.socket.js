import {
  clearBotTimers,
  getAbilityDescription,
  handleBotPhase,
  updateBotMemories,
} from "../ai/botController.js";
import { createGame, getGame, updateGame } from "../game/gameManager.js";
import { clearPhaseTimer, startPhaseTimer } from "../game/phaseManager.js";
import {
  resolveRound,
  resolveCollabVoting,
  checkWinConditions,
} from "../game/resolver.js";

const broadcastGameState = (io, gameId, game) => {
  const players = (game.players || []).map((p) => ({
    id: p.id,
    color: p.color,
    alive: p.alive,
    role: p.role,
    aura: p.aura,
    vibe: p.vibe,
    note: p.note,
  }));

  io.to(gameId).emit("game-state-updated", {
    phase: game.phase,
    round: game.round,
    phaseTimer: game.phaseTimer,
    collabProposals: game.collabProposals,
    currentEvent: game.currentEvent,
    currentCollab: game.currentCollab,
    collabHost: game.collabHost,
    players,
  });
};

export const registerGameSockets = (io, socket) => {
  socket.on("join-gameplay", ({ gameId, player }) => {
    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.data.playerId = player.id;
    socket.data.playerColor = player.color;

    const existingGame = getGame(gameId);
    const game =
      existingGame ||
      createGame(gameId, [
        { id: "red", color: "red" },
        { id: "blue", color: "blue" },
        { id: "green", color: "green" },
        { id: "pink", color: "pink" },
        { id: "orange", color: "orange" },
      ]);

    const myPlayer = game.players.find((p) => p.id === player.id);

    socket.emit("game-state", {
      phase: game.phase,
      round: game.round,
      phaseTimer: game.phaseTimer,
      collabProposals: game.collabProposals,
      currentEvent: game.currentEvent,
      myPlayer: {
        ...myPlayer,
        role: myPlayer.role,
        aura: myPlayer.aura,
        vibe: myPlayer.vibe,
      },
      otherPlayers: game.players
        .filter((p) => p.id !== player.id)
        .map((p) => ({
          id: p.id,
          color: p.color,
          alive: p.alive,
          role: p.role,
          aura: p.aura,
          vibe: p.vibe,
        })),
    });

    socket.to(gameId).emit("player-joined", {
      playerId: player.id,
      playerColor: player.color,
    });
  });

  socket.on("change-color", ({ gameId, oldColor, newColor }) => {
    updateGame(gameId, (game) => {
      const player = game.players.find((p) => p.color === oldColor);
      if (player) {
        player.color = newColor;
      }
    });

    io.to(gameId).emit("player-color-changed", { oldColor, newColor });
  });

  socket.on("start-gameplay", ({ gameId }) => {
    const game = getGame(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found!" });
      return;
    }

    updateGame(gameId, (game) => {
      game.phase = "COLLAB_PROPOSAL";
      game.phaseTimer = Date.now() + 60000;
    });

    const updatedGame = getGame(gameId);
    io.to(gameId).emit("phase-changed", {
      phase: "COLLAB_PROPOSAL",
      timer: updatedGame.phaseTimer,
    });

    broadcastGameState(io, gameId, updatedGame);
    startPhaseTimer(io, gameId, "COLLAB_PROPOSAL", 60000);

    // TRIGGER BOT ACTIONS
    handleBotPhase(io, gameId, "COLLAB_PROPOSAL");
  });

  socket.on("propose-collab", ({ gameId, proposerColor }) => {
    updateGame(gameId, (game) => {
      if (!game.collabProposals) game.collabProposals = [];
      const existing = game.collabProposals.find(
        (p) => p.proposer === proposerColor,
      );
      if (existing) return;

      game.collabProposals.push({
        id: `collab-${Date.now()}`,
        proposer: proposerColor,
        votes: [],
        createdAt: Date.now(),
      });
    });

    const game = getGame(gameId);
    io.to(gameId).emit("collab-proposed", {
      proposals: game.collabProposals,
      skipVotes: game.skipVotes || [],
    });
  });

  socket.on("vote-collab", ({ gameId, collabId, voterColor }) => {
    updateGame(gameId, (game) => {
      if (!game.collabProposals) game.collabProposals = [];
      if (!game.skipVotes) game.skipVotes = [];

      if (collabId === "skip") {
        game.collabProposals.forEach((p) => {
          p.votes = p.votes.filter((v) => v !== voterColor);
        });

        const idx = game.skipVotes.indexOf(voterColor);
        if (idx === -1) {
          game.skipVotes.push(voterColor);
        } else {
          game.skipVotes.splice(idx, 1);
        }
        return;
      }

      const proposal = game.collabProposals.find((p) => p.id === collabId);
      if (!proposal) return;

      game.collabProposals.forEach((p) => {
        p.votes = p.votes.filter((v) => v !== voterColor);
      });

      game.skipVotes = (game.skipVotes || []).filter((v) => v !== voterColor);
      proposal.votes.push(voterColor);
    });

    const game = getGame(gameId);
    io.to(gameId).emit("collab-vote-updated", {
      collabId,
      voterColor,
      skipVotes: game.skipVotes || [],
      proposals: game.collabProposals,
    });
  });

  socket.on("end-collab-voting", ({ gameId }) => {
    const game = getGame(gameId);
    const results = resolveCollabVoting(game);

    updateGame(gameId, (game) => {
      game.currentCollab = results.winningCollab;
      game.collabHost = results.winningCollab?.proposer;
      game.phase = "DM_PHASE";
      game.phaseTimer = Date.now() + 45000;

      results.auraChanges.forEach(({ playerId, change }) => {
        const player = game.players.find((p) => p.id === playerId);
        if (player) player.aura += change;
      });
    });

    io.to(gameId).emit("collab-resolved", results);
    io.to(gameId).emit("phase-changed", {
      phase: "DM_PHASE",
      timer: game.phaseTimer,
    });

    const updatedGame = getGame(gameId);
    broadcastGameState(io, gameId, updatedGame);

    // TRIGGER BOT ACTIONS FOR DM PHASE
    handleBotPhase(io, gameId, "DM_PHASE");
  });

  socket.on("submit-ability", ({ gameId, ability, target, playerColor }) => {
    const game = getGame(gameId);
    if (!game) return;

    updateGame(gameId, (game) => {
      if (!game.abilities) game.abilities = {};
      game.abilities[playerColor] = { ability, target };
    });

    // Get player names for toast messages
    const actor = game.players.find((p) => p.color === playerColor);
    const targetPlayer = game.players.find((p) => p.color === target);
    const isSelf = target === playerColor;

    if (!actor || !targetPlayer) {
      socket.emit("ability-submitted", { ability, target });
      return;
    }

    const descriptions = getAbilityDescription(
      ability,
      actor.name,
      targetPlayer.name,
      isSelf,
    );

    // Send toast to the actor
    io.to(gameId).emit("ability-used", {
      playerColor: playerColor,
      message: descriptions.actor,
      type: "success",
    });

    // Send toast to the target (if not self)
    if (!isSelf) {
      io.to(gameId).emit("ability-used", {
        playerColor: target,
        message: descriptions.target,
        type:
          ability === "attack" || ability === "sabotage" ? "warning" : "info",
      });
    }

    socket.emit("ability-submitted", { ability, target });
  });

  socket.on("submit-vote", ({ gameId, target, voterColor }) => {
    updateGame(gameId, (game) => {
      if (!game.votes) game.votes = {};
      game.votes[voterColor] = target;
    });

    const updatedGame = getGame(gameId);
    socket.emit("vote-submitted", { target });

    if (updatedGame) {
      io.to(gameId).emit("vote-updated", { votes: updatedGame.votes || {} });
    }
  });

  socket.on("end-action-phase", ({ gameId }) => {
    const game = getGame(gameId);
    const results = resolveRound(game);

    updateGame(gameId, (game) => {
      results.changes.forEach((change) => {
        const player = game.players.find((p) => p.color === change.color);
        if (!player) return;

        if (change.auraChange) player.aura += change.auraChange;
        if (change.vibeChange) player.vibe += change.vibeChange;
        if (change.eliminated) player.alive = false;
      });

      const winners = checkWinConditions(game);
      if (winners.length > 0) {
        game.phase = "GAME_OVER";
        game.winners = winners;
      } else {
        game.round += 1;
        game.phase = "COLLAB_PROPOSAL";
        game.phaseTimer = Date.now() + 60000;
        game.abilities = {};
        game.votes = {};
        game.collabProposals = [];
        game.currentCollab = null;
      }
    });

    const updatedGame = getGame(gameId);

    // UPDATE BOT MEMORIES
    updateBotMemories(updatedGame, results);

    io.to(gameId).emit("round-resolved", results);

    if (updatedGame.phase === "GAME_OVER") {
      clearBotTimers(gameId);
      io.to(gameId).emit("game-over", {
        winners: updatedGame.winners,
      });
    } else {
      broadcastGameState(io, gameId, updatedGame);
      io.to(gameId).emit("phase-changed", {
        phase: updatedGame.phase,
        round: updatedGame.round,
        timer: updatedGame.phaseTimer,
      });

      // TRIGGER NEXT PHASE
      handleBotPhase(io, gameId, updatedGame.phase);
    }
  });

  socket.on("save-note", ({ gameId, playerColor, note }) => {
    updateGame(gameId, (game) => {
      const player = game.players.find((p) => p.color === playerColor);
      if (player) player.note = note;
    });

    socket.emit("note-saved", { note });
  });

  socket.on("stats-changed", ({ gameId, playerColor, aura, vibe }) => {
    updateGame(gameId, (game) => {
      const player = game.players.find((p) => p.color === playerColor);
      if (player) {
        if (aura !== undefined) player.aura = aura;
        if (vibe !== undefined) player.vibe = vibe;
      }
    });

    const updatedGame = getGame(gameId);
    broadcastGameState(io, gameId, updatedGame);
  });

  socket.on("disconnect", () => {
    const gameId = socket.data.gameId;
    if (gameId) {
      clearPhaseTimer(gameId);
      clearBotTimers(gameId);
    }
  });
};

console.log("✅ Game Sockets with Bot Integration Loaded");
