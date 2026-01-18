import http from "http";
import app from "./app.js";
import { setupSocket } from "./socket.js";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);
setupSocket(server);

server.listen(3001, () => {
  console.log("Backend running on port 3001");
});
