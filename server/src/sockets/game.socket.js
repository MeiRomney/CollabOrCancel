import { createGame, getGame, updateGame } from "../game/gameManager.js";
import { clearPhaseTimer, startPhaseTimer } from "../game/phaseManager.js";
import { resolveRound, resolveCollabVoting, checkWinConditions } from "../game/resolver.js";

// Helper function to broadcast updated game state to all players in a room
// Emits a single shared state containing full players list; clients derive their own `myPlayer` from it.
const broadcastGameState = (io, gameId, game) => {
    const players = (game.players || []).map(p => ({
        id: p.id,
        color: p.color,
        alive: p.alive,
        role: p.role,
        aura: p.aura,
        vibe: p.vibe,
        note: p.note
    }));

    io.to(gameId).emit("game-state-updated", {
        phase: game.phase,
        round: game.round,
        phaseTimer: game.phaseTimer,
        collabProposals: game.collabProposals,
        currentEvent: game.currentEvent,
        currentCollab: game.currentCollab,
        collabHost: game.collabHost,
        players
    });
};

export const registerGameSockets = (io, socket) => {
    // Player joins game
    socket.on("join-gameplay", ({ gameId, player }) => {
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.playerId = player.id;
        socket.data.playerColor = player.color;

        const existingGame = getGame(gameId);
        const game = existingGame || createGame(gameId, [
            { id: "red", color: "red" },
            { id: "blue", color: "blue" },
            { id: "green", color: "green" },
            { id: "pink", color: "pink" },
            { id: "orange", color: "orange" }
        ]);

        const myPlayer = game.players.find(p => p.id === player.id);

        // Send game state only to the joining player (with their private info)
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
                vibe: myPlayer.vibe
            },
            otherPlayers: game.players
                .filter(p => p.id !== player.id)
                .map(p => ({
                    id: p.id,
                    color: p.color,
                    alive: p.alive,
                    role: p.role,
                    aura: p.aura,
                    vibe: p.vibe
                }))
        });

        // Notify others about new player
        socket.to(gameId).emit("player-joined", {
            playerId: player.id,
            playerColor: player.color
        });
    });

    socket.on('change-color', ({ gameId, oldColor, newColor }) => {
        updateGame(gameId, (game) => {
            const player = game.players.find(p => p.color === oldColor);
            if(player) {
                player.color = newColor;
            }
        });

        io.to(gameId).emit('player-color-changed', { oldColor, newColor });
    });

    // Start game
    socket.on("start-gameplay", ({ gameId }) => {
        const game = getGame(gameId);
        if(!game) {
            socket.emit('error', { message: 'Game not found!' });
            return;
        }

        updateGame(gameId, (game) => {
            game.phase = "COLLAB_PROPOSAL";
            game.phaseTimer = Date.now() + 60000;
        });
        
        const updatedGame = getGame(gameId);
        io.to(gameId).emit("phase-changed", {
            phase: "COLLAB_PROPOSAL",
            timer: game.phaseTimer
        });

        // Broadcast updated game state so clients receive initial player stats (aura/vibe)
        broadcastGameState(io, gameId, updatedGame);

        // Start automatic timer
        startPhaseTimer(io, gameId, "COLLAB_PROPOSAL", 60000);
    });

    // Collab proposal
    socket.on("propose-collab", ({ gameId, proposerColor }) => {
        updateGame(gameId, (game) => {
            if(!game.collabProposals) game.collabProposals = [];

            // Check if player already proposed
            const existing = game.collabProposals.find(p => p.proposer === proposerColor);
            if(existing) return;

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
        });
    });

    // Vote for collab
    socket.on("vote-collab", ({ gameId, collabId, voterColor }) => {
        updateGame(gameId, (game) => {
            
            if(collabId === "skip") {
                game.collabProposals.forEach(p => {
                    p.votes = p.votes.filter(v => v !== voterColor);
                });
                return;
            }

            const proposal = game.collabProposals.find(p => p.id === collabId);
            if(!proposal) return;

            // Remove all previous votes from this player
            game.collabProposals.forEach(p => {
                p.votes = p.votes.filter(v => v !== voterColor);
            });

            proposal.votes.push(voterColor);
        });

        io.to(gameId).emit("collab-vote-updated", {
            collabId,
            voterColor,
        });
    });

    // End collab voting phase
    socket.on("end-collab-voting", ({ gameId }) => {
        const game = getGame(gameId);
        const results = resolveCollabVoting(game);

        updateGame(gameId, (game) => {
            game.currentCollab = results.winningCollab;
            game.collabHost = results.winningCollab?.proposer;
            game.phase = "DM_PHASE";
            game.phaseTimer = Date.now() + 45000;

            // Update player Aura based on collab results
            results.auraChanges.forEach(({ playerId, change }) => {
                const player = game.players.find(p => p.id === playerId);
                if(player) player.aura += change;
            });
        });

        io.to(gameId).emit("collab-resolved", results);
        io.to(gameId).emit("phase-changed", {
            phase: "DM_PHASE",
            timer: game.phaseTimer,
        });

        // Broadcast updated game state with new player stats
        const updatedGame = getGame(gameId);
        broadcastGameState(io, gameId, updatedGame);
    });

    // Submit ability
    socket.on("submit-ability", ({ gameId, ability, target, playerColor }) => {
        updateGame(gameId, (game) => {
            if(!game.abilities) game.abilities = {};
            game.abilities[playerColor] = { ability, target };
        });

        // Only notify the player who submitted
        socket.emit("ability-submitted", { ability, target });
    });

    // Submit vote
    socket.on("submit-vote", ({ gameId, target, voterColor }) => {
        updateGame(gameId, (game) => {
            if(!game.votes) game.votes = {};
            game.votes[voterColor] = target;
        });

        socket.emit("vote-submitted", { target });
    });

    // End action phase and resolve round
    socket.on("end-action-phase", ({ gameId }) => {
        const game = getGame(gameId);
        const results = resolveRound(game);

        updateGame(gameId, (game) => {
            // Apply all changes from resolution
            results.changes.forEach(change => {
                const player = game.players.find(p => p.color === change.color);
                if(!player) return;

                if(change.auraChange) player.aura += change.auraChange;
                if(change.vibeChange) player.vibe += change.vibeChange;
                if(change.eliminated) player.alive = false;
            });

            // Check for winners
            const winners = checkWinConditions(game);
            if(winners.length > 0) {
                game.phase = "GAME_OVER";
                game.winners = winners;
            } else {
                // Move to the next round
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

        // Send resolution to all players
        io.to(gameId).emit("round-resolved", results);

        if(updatedGame.phase === "GAME_OVER") {
            io.to(gameId).emit("game-over", {
                winners: updatedGame.winners
            });
        } else {
            // Broadcast updated game state with new player stats
            broadcastGameState(io, gameId, updatedGame);
            io.to(gameId).emit("phase-changed", {
                phase: updatedGame.phase,
                round: updatedGame.round,
                timer: updatedGame.phaseTimer
            });
        }
    });

    // Save note
    socket.on("save-note", ({ gameId, playerColor, note }) => {
        updateGame(gameId, (game) => {
            const player = game.players.find(p => p.color === playerColor);
            if(player) player.note = note;
        });
        
        // Emit note update back to the player
        socket.emit("note-saved", { note });
    });

    socket.on("disconnect", () => {
        const gameId = socket.data.gameId;
        if(gameId) {
            clearPhaseTimer(gameId);
        }
    });
};
