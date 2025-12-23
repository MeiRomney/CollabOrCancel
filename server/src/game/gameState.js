export const createInitialGameState = (players) => ({
    phase: "STARTING",
    round: 1,

    players: players.map(p => ({
        id: p.id,
        color: p.color,
        role: p.role,
        alive: true,
        aura: 5,
    })),

    abilities: {}, // playerId -> { ability, target }
    votes: {}, // playerId -> targetId
    dmRequests: {},

    timers: {},
});