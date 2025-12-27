import { createInitialGameState } from "./gameState.js";

const games = new Map();

export const createGame = (gameId, players) => {
    const game = createInitialGameState(players);
    games.set(gameId, game);
    return game;
};

export const getGame = (gameId) => games.get(gameId);

export const updateGame = (gameId, updater) => {
    const game = games.get(gameId);
    if(!game) return null;
    updater(game);
    return game;
};

export const deleteGame = (gameId) => {
    games.delete(gameId);
}