import { Server } from "socket.io";
import { registerGameSockets } from "./sockets/game.socket.js";
import { registerChatSockets } from "./sockets/chat.socket.js";
import { registerDmSockets } from "./sockets/dm.socket.js";
import { registerMatchmakingSockets } from "./sockets/matchMaking.socket.js";
import dotenv from "dotenv";

dotenv.config();

export const setupSocket = (server) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [clientUrl];
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected: ", socket.id);

    registerMatchmakingSockets(io, socket);
    registerGameSockets(io, socket);
    registerChatSockets(io, socket);
    registerDmSockets(io, socket);

    socket.on("disconnect", () => {
      console.log("Disconnected: ", socket.id);
    });
  });

  return io;
};
