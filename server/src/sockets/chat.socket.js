export const registerChatSockets = (io, socket) => {
    socket.on("send-message", ({ gameId, message, senderColor }) => {
        io.to(gameId).emit("message-received", {
            message,
            senderColor,
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