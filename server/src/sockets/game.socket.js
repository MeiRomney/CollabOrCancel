import { getGame, updateGame } from "../game/gameManager.js";
import { resolveRound } from "../game/resolver.js";

export const registerGameSockets = (io, socket) => {
    // Player joins game
    socket.on("join-game", ({ gameId, player }) => {
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.playerId = player.id;
        socket.data.playerColor = player.color;

        const game = getGame(gameId);

        // Send game state only to the joining player (with their private info)
        socket.emit("game-state", {
            ...game,
            myPlayer: game.players.find(p => p.id === player.id)
        });

        // Notify others about new player
        socket.to(gameId).emit("player-joined", {
            playerId: player.id,
            playerColor: player.color
        });
    });

    // Start game
    socket.on("start-game", ({ gameId }) => {
        updateGame(gameId, (game) => {
            game.phase = "COLLAB_PROPOSAL";
            game.phaseTimer = Date.now() + 60000;
        });

        const game = getGame(gameId);
        io.to(gameId).emit("phase-changed", {
            phase: "COLLAB_PROPOSAL",
            timer: game.phaseTimer
        });
    });

    // Collab proposal
    socket.on("propose-collab", ({ gameId, proposerColor }) => {
        updateGame(gameId, (game) => {
            if(!game.collabPoposals) game.collabPoposals = [];

            // Check if player already proposed
            const existing = game.collabPoposals.find(p => p.proposer === proposerColor);
            if(existing) return;

            game.collabPoposals.push({
                id: `collab-${Date.now()}`,
                proposer: proposerColor,
                votes: [],
                createdAt: Date.now(),
            });
        });

        const game = getGame(gameId);
        io.to(gameId).emit("collab-proposed", {
            proposals: game.collabPoposals,
        });
    });

    // Vote for collab
    socket.on("vote-collab", ({ gameId, collabId, voterColor }) => {
        updateGame(gameId, (game) => {
            const proposal = game.collabPoposals.find(p => p.id === collabId);
            if(!proposal) return;

            // Remove all previous votes from this player
            game.collabPoposals.forEach(p => {
                p.votes = p.votes.filter(v => v !== voterColor);
            });

            // Add new vote
            if(collabId !== "skip") {
                proposal.votes.push(voterColor);
            }
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
    });
};

// Helper function to resolve collab voting
function resolveCollabVoting(game) {
    const proposals = game.collabPoposals || [];

    if(proposals.length === 0) {
        return { winningCollab: null, auraChanges: [] };
    }

    // Find proposal with most votes
    let maxVotes = 0;
    let winners = [];

    proposals.forEach(proposal => {
        const voteCount = proposal.votes.length;
        if(voteCount > maxVotes) {
            maxVotes = voteCount;
            winners = [proposal];
        } else if(voteCount === maxVotes) {
            winners.push(proposal);
        }
    });

    const auraChanges = [];

    // Handle tie; all tied collabs get +1 Aura
    if(winners.length > 1) {
        winners.forEach(collab => {
            collab.votes.forEach(voterColor => {
                const player = game.players.find(p => p.color === voterColor);
                auraChanges.push({
                    playerId: player.id,
                    playerColor: voterColor,
                    change: 1,
                    reason: "Tied collab vote",
                });
            });
        });
        return { winningCollab: null, auraChanges, tie: true };
    }

    // Single winner
    const winningCollab = winners[0];

    // Winner proposer gets +2 Aura
    const proposer = game.players.find(p => p.color === winningCollab.proposer);
    auraChanges.push({
        playerId: proposer.id,
        playerColor: proposer.color,
        change: 2,
        reason: "Won collab proposal",
    });

    // Members get +1 Aura
    winningCollab.votes.forEach(voterColor => {
        const player = game.players.find(p => p.color === voterColor);
        auraChanges.push({
            playerId: player.id,
            playerColor: voterColor,
            change: 1,
            reason: "Voted for winning collab",
        });
    });

    // Loser proposer gets -2 Aura
    proposals.forEach(proposal => {
        if(proposal.id === winningCollab.id) return;
        const losingProposer = proposal.proposer;
        auraChanges.push({
            playerId: losingProposer.id,
            playerColor: losingProposer.color,
            change: -2,
            reason: "Lose collab proposal",
        });
    });

    // Losers get -1 Aura
    proposals.forEach(proposal => {
        if(proposal.id === winningCollab.id) return;
        proposal.votes.forEach(voterColor => {
            const player = game.players.find(p => p.color === voterColor);
            auraChanges.push({
                playerId: player.id,
                playerColor: voterColor,
                change: -1,
                reason: "Voted for losing collab"
            });
        });
    });

    return { winningCollab, auraChanges };
}

// Helper function to check win condition
function checkWinConditions(game) {
    const alivePlayers = game.players.filter(p => p.alive);
    const winners = [];

    // Check if any doomers have 10+ Aura
    const winningDoomer = alivePlayers.find(p => p.role === "doomer" && p.aura >= 10);
    if(winningDoomer) {
        return [{ id: winningDoomer.id, color: winningDoomer.color, role: "doomer" }];
    }

    // Check if two vibers have 10+ Aura
    const winningVibers = alivePlayers.filter(p => p.role === "viber" && p.aura >= 10);
    if(winningVibers.length >= 2) {
        return winningVibers.map(v => ({ id: v.id, color: v.color, role: "viber" }));
    }

    // End game with two players remaining
    if(alivePlayers.length === 2) {
        const roles = alivePlayers.map(p => p.role);

        if(roles.every(r => r === "viber")) {
            return alivePlayers.map(p => ({ id: p.id, color: p.color, role: p.role }));
        }
        if(roles.every(r => r === "doomer")) {
            return alivePlayers.map(p => ({ id: p.id, color: p.color, role: p.role }));
        }
        if(roles.includes("doomer")) {
            const doomer = alivePlayers.find(p => p.role === "doomer");
            return [{ id: doomer.id, color: doomer.color, role: "doomer" }];
        }
    }

    return winners;
}