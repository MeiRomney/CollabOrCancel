import { getGame, updateGame } from "../game/gameManager.js";

export const registerGameSockets = (io, socket) => {

    // Player joins game
    socket.on("join-game", ({ gameId, player }) => {
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.playerId = player.id;

        const game = getGame(gameId);
        socket.emit("game-state", game);
    });

    // Start game
    socket.on("start-game", ({ gameId }) => {
        updateGame(gameId, (game) => {
            game.phase = "PLAY";
        });

        io.to(gameId).emit("phase-changed", {
            phase: "PLAY",
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