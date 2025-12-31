import { Server } from "socket.io";
import { registerGameSockets } from "./sockets/game.socket.js";
import { registerChatSockets } from "./sockets/chat.socket.js";
import { registerDmSockets } from "./sockets/dm.socket.js";

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: { 
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id);

        registerGameSockets(io, socket);
        registerChatSockets(io,socket);
        registerDmSockets(io, socket);

        socket.on("disconnect", () => {
            console.log("Disconnected: ", socket.id);
        });
    });
};