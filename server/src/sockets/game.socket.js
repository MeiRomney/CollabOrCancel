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
    socket.on("submit-ability", ({ gameId, ability, target }) => {
        updateGame(gameId, (game) => {
            game.abilities[socket.data.playerId] = { ability, target };
        });
    });

    // Submit vote
    socket.on("submit-vote", ({ gameId, target }) => {
        updateGame(gameId, (game) => {
            game.votes[socket.data.playerId] = target;
        });
    });
};