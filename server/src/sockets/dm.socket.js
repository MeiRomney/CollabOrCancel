export const registerDmSockets = (io, socket) => {
    socket.on("request-dm", ({ gameId, from, to }) => {
        io.to(gameId).emit("dm-requested", { from, to });
    });

    socket.on("accept-dm", ({ gameId, from, to }) => {
        io.to(gameId).emit("dm-started", { from, to });
    });
};