import {
  resolveCollabVoting,
  resolveRound,
  checkWinConditions,
} from "./resolver.js";
import { getGame, updateGame } from "./gameManager.js";
import { drawRandomEvent } from "./gameState.js";
import { handleBotPhase, updateBotMemories } from "../ai/botController.js";

const phaseTimers = new Map();

export const startPhaseTimer = (io, gameId, phase, duration) => {
  // Clear existing timer
  clearPhaseTimer(gameId);

  const timer = setTimeout(() => {
    handlePhaseTimeout(io, gameId, phase);
  }, duration);

  phaseTimers.set(gameId, timer);
};

export const clearPhaseTimer = (gameId) => {
  const timer = phaseTimers.get(gameId);
  if (timer) {
    clearTimeout(timer);
    phaseTimers.delete(gameId);
  }
};

export function checkAutoAdvancePhase(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const humanPlayers = game.players.filter((p) => p.alive && !p.isBot);

  // If only bots are left, speed up the game
  if (humanPlayers.length === 0) {
    // All players are bots - advance phase quickly
    return true;
  }

  // Check if all humans have submitted their actions
  const allHumansReady = humanPlayers.every((p) => {
    if (game.phase === "COLLAB_PROPOSAL") {
      // Check if human voted or proposed
      const proposed = game.collabProposals?.some(
        (cp) => cp.proposer === p.color,
      );
      const voted = game.collabProposals?.some((cp) =>
        cp.votes.includes(p.color),
      );
      const skipped = game.skipVotes?.includes(p.color);
      return proposed || voted || skipped;
    }

    if (game.phase === "DM_PHASE") {
      // Check if human submitted ability
      return game.abilities?.[p.color] !== undefined;
    }

    if (game.phase === "VOTING_PHASE") {
      // Check if human voted
      return game.votes?.[p.color] !== undefined;
    }

    return false;
  });

  // If all humans ready, can advance early
  return allHumansReady;
}

// Call this periodically or when actions are submitted:
export function maybeAdvancePhase(io, gameId) {
  if (checkAutoAdvancePhase(io, gameId)) {
    // Reduce remaining timer to 5 seconds
    const game = getGame(gameId);
    const newTimer = Date.now() + 5000;

    updateGame(gameId, (g) => {
      g.phaseTimer = newTimer;
    });

    io.to(gameId).emit("timer-updated", {
      phaseTimer: newTimer,
      reason: "all_players_ready",
    });
  }
}

const handlePhaseTimeout = (io, gameId, currentPhase) => {
  const game = getGame(gameId);
  if (!game) return;

  switch (currentPhase) {
    case "COLLAB_PROPOSAL":
      // Auto-advance to voting
      advanceToCollabVoting(io, gameId);
      break;

    case "COLLAB_VOTING":
      // Auto-resolve collab and move to DM phase
      resolveCollabPhase(io, gameId);
      break;

    case "DM_PHASE":
      // Move to action phase
      advanceToActionPhase(io, gameId);
      break;

    case "ACTION_PHASE":
      // Auto-resolve round
      resolveRoundPhase(io, gameId);
      break;
  }
};

function advanceToCollabVoting(io, gameId) {
  updateGame(gameId, (game) => {
    game.phase = "COLLAB_VOTING";
    game.phaseTimer = Date.now() + 30000; // 30 seconds to vote
  });

  const game = getGame(gameId);
  io.to(gameId).emit("phase-changed", {
    phase: "COLLAB_VOTING",
    timer: game.phaseTimer,
    proposals: game.collabProposals,
  });

  startPhaseTimer(io, gameId, "COLLAB_VOTING", 30000);
  handleBotPhase(io, gameId, "COLLAB_VOTING");
}

function resolveCollabPhase(io, gameId) {
  const game = getGame(gameId);
  const results = resolveCollabVoting(game);

  updateGame(gameId, (g) => {
    g.currentCollab = results.winningCollab;
    g.collabHost = results.winningCollab?.proposer;
    g.phase = "DM_PHASE";
    g.phaseTimer = Date.now() + 45000;

    results.auraChanges.forEach(({ playerColor, change }) => {
      const player = g.players.find((p) => p.color === playerColor);
      if (player) player.aura += change;
    });
  });

  io.to(gameId).emit("collab-resolved", results);
  io.to(gameId).emit("phase-changed", {
    phase: "DM_PHASE",
    timer: game.phaseTimer,
  });

  startPhaseTimer(io, gameId, "DM_PHASE", 45000);
  handleBotPhase(io, gameId, "DM_PHASE");
}

function advanceToActionPhase(io, gameId) {
  const game = getGame(gameId);

  // Draw random event
  const event = drawRandomEvent();

  updateGame(gameId, (g) => {
    g.currentEvent = event;
    g.phase = "ACTION_PHASE";
    g.phaseTimer = Date.now() + 60000; // 60 seconds for action
  });

  io.to(gameId).emit("event-drawn", { event });
  io.to(gameId).emit("phase-changed", {
    phase: "ACTION_PHASE",
    timer: game.phaseTimer,
    event,
  });

  startPhaseTimer(io, gameId, "ACTION_PHASE", 60000);
  handleBotPhase(io, gameId, "ACTION_PHASE");
}

function resolveRoundPhase(io, gameId) {
  const game = getGame(gameId);
  const results = resolveRound(game);

  updateGame(gameId, (g) => {
    results.changes.forEach((change) => {
      const player = g.players.find((p) => p.color === change.color);
      if (!player) return;

      if (change.auraChange) player.aura += change.auraChange;
      if (change.vibeChange) player.vibe += change.vibeChange;
      if (change.eliminated) player.alive = false;
    });

    const winners = checkWinConditions(g);
    if (winners.length > 0) {
      g.phase = "GAME_OVER";
      g.winners = winners;
    } else {
      g.round += 1;
      g.phase = "COLLAB_PROPOSAL";
      g.phaseTimer = Date.now() + 60000;
      g.abilities = {};
      g.votes = {};
      g.collabProposals = [];
      g.currentCollab = null;
      g.currentEvent = null;
    }
  });

  const updatedGame = getGame(gameId);
  updateBotMemories(updatedGame, results);

  io.to(gameId).emit("round-resolved", results);

  // Broadcast updated player stats to all players
  const players = (updatedGame.players || []).map((p) => ({
    id: p.id,
    color: p.color,
    alive: p.alive,
    role: p.role,
    aura: p.aura,
    vibe: p.vibe,
    note: p.note,
  }));

  io.to(gameId).emit("game-state-updated", {
    phase: updatedGame.phase,
    round: updatedGame.round,
    phaseTimer: updatedGame.phaseTimer,
    collabProposals: updatedGame.collabProposals,
    currentEvent: updatedGame.currentEvent,
    currentCollab: updatedGame.currentCollab,
    collabHost: updatedGame.collabHost,
    players,
  });

  if (updatedGame.phase === "GAME_OVER") {
    clearPhaseTimer(gameId);
    io.to(gameId).emit("game-over", { winners: updatedGame.winners });
  } else {
    io.to(gameId).emit("phase-changed", {
      phase: updatedGame.phase,
      round: updatedGame.round,
      timer: updatedGame.phaseTimer,
    });
    startPhaseTimer(io, gameId, "COLLAB_PROPOSAL", 60000);
    handleBotPhase(io, gameId, updatedGame.phase);
  }
}
