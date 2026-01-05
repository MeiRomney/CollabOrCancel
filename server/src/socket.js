import { Server } from "socket.io";
import { registerGameSockets } from "./sockets/game.socket.js";
import { registerChatSockets } from "./sockets/chat.socket.js";
import { registerDmSockets } from "./sockets/dm.socket.js";
import { registerMatchmakingSockets } from "./sockets/matchMaking.socket.js";

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: "http://localhost:5173" },
    });

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id);

        registerMatchmakingSockets(io, socket);
        registerGameSockets(io, socket);
        registerChatSockets(io,socket);
        registerDmSockets(io, socket);

        socket.on("disconnect", () => {
            console.log("Disconnected: ", socket.id);
        });
    });

    return io;
};