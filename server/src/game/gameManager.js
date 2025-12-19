import { createInitialGameState } from "./gameState.js";

const games = new Map();

export const createGame = (gameId, players) => {
    games.set(gameId, createInitialGameState(players));
};

export const getGame = (gameId) => games.get(gameId);

export const updateGame = (gameId, updater) => {
    const game = games.get(gameId);
    if(!game) return;
    updater(game);
};