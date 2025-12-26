export const registerChatSockets = (io, socket) => {
    socket.on("send-message", ({ gameId, message, senderColor, senderRole }) => {
        io.to(gameId).emit("message-received", {
            message,
            senderColor,
            senderRole,
            timestamp: Date.now()
        });
    });

    socket.on("typing", ({ gameId, playerColor, isTyping }) => {
        socket.to(gameId).emit("player-typing", {
            playerColor, 
            isTyping
        });
    });
};