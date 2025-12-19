export const startPhaseTimer = (io, gameId, duration, nextPhase) => {
    setTimeout(() => {
        io.to(gameId).emit("phase-ended", nextPhase);
    }, duration);
};