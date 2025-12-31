export const registerDmSockets = (io, socket) => {
    socket.on("request-dm", ({ gameId, from, to }) => {
        // Emit to entire game room so front end can show the request
        io.to(gameId).emit("dm-requested", { from, to });
    });

    socket.on("accept-dm", ({ gameId, from, to }) => {
        // Create a private room for these two players
        const dmRoom = `dm-${gameId}-${from}-${to}`;

        // Get sockets for both players
        const sockets = Array.from(io.sockets.sockets.values());
        const fromSocket = sockets.find(s => s.data?.gameId === gameId && s.data?.playerColor === from);
        const toSocket = sockets.find(s => s.data?.gameId === gameId && s.data?.playerColor === to);

        if(fromSocket && toSocket) {
            fromSocket.join(dmRoom);
            toSocket.join(dmRoom);

            // Notify both players that DM started
            io.to(gameId).emit("dm-started", { from, to, room: dmRoom });
        }

        // Notify game room that DM was accepted
        io.to(gameId).emit("dm-accepted", { from, to });
    });

    socket.on("reject-dm", ({ gameId, from, to }) => {
        io.to(gameId).emit("dm-rejected", { from, to });
    });

    socket.on("send-dm-message", ({ room, message, senderColor }) => {
        io.to(room).emit("dm-message-received", {
            message,
            senderColor,
            timestamp: Date.now()
        });
    });

    socket.on("leave-dm", ({ room, gameId, playerColor }) => {
        socket.leave(room);
        io.to(room).emit("dm-ended", { playerColor });
    });
};