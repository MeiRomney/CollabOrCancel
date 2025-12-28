import { resolveCollabVoting, resolveRound, checkWinConditions } from "./resolver.js";
import { getGame, updateGame } from "./gameManager.js";
import { drawRandomEvent } from "./gameState.js";

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
    if(timer) {
        clearTimeout(timer);
        phaseTimers.delete(gameId);
    }
};

const handlePhaseTimeout = (io, gameId, currentPhase) => {
    const game = getGame(gameId);
    if(!game) return;

    switch(currentPhase) {
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
        proposals: game.collabProposals
    });

    startPhaseTimer(io, gameId, "COLLAB_VOTING", 30000);
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
            const player = g.players.find(p => p.color === playerColor);
            if(player) player.aura += change;
        });
    });

    io.to(gameId).emit("collab-resolved", results);
    io.to(gameId).emit("phase-changed", {
        phase: "DM_PHASE",
        timer: game.phaseTimer
    });

    startPhaseTimer(io, gameId, "DM_PHASE", 45000);
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
        event
    });

    startPhaseTimer(io, gameId, "ACTION_PHASE", 60000);
}

function resolveRoundPhase(io, gameId) {
    const game = getGame(gameId);
    const results = resolveRound(game);

    updateGame(gameId, (g) => {
        results.changes.forEach(change => {
            const player = g.players.find(p => p.color === change.color);
            if(!player) return;

            if(change.auraChange) player.aura += change.auraChange;
            if(change.vibeChange) player.vibe += change.vibeChange;
            if(change.eliminated) player.alive = false;
        });

        const winners = checkWinConditions(g);
        if(winners.length > 0) {
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

    io.to(gameId).emit("round-resolved", results);

    if(updatedGame.phase === "GAME_OVER") {
        clearPhaseTimer(gameId);
        io.to(gameId).emit("game-over", { winners: updatedGame.winners });
    } else {
        io.to(gameId).emit("phase-changed", {
            phase: updatedGame.phase,
            round: updatedGame.round,
            timer: updatedGame.phaseTimer
        });
        startPhaseTimer(io, gameId, "COLLAB_PROPOSAL", 60000);
    }
}