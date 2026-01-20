// dmSockets.js - Unified version
import { getGame, updateGame } from "../game/gameManager.js";
import { decideBotDMResponse, generateBotDMMessage } from "../ai/botAIChat.js";

export const registerDmSockets = (io, socket) => {
  socket.on("request-dm", async ({ gameId, from, to }) => {
    // Store in game state
    updateGame(gameId, (game) => {
      if (!game.pendingDMRequests) {
        game.pendingDMRequests = [];
      }
      game.pendingDMRequests.push({ from, to, timestamp: Date.now() });
    });

    // Emit to entire game room
    io.to(gameId).emit("dm-requested", { from, to });

    // Check if recipient is a bot
    const game = getGame(gameId);
    if (!game) return;

    const recipient = game.players.find((p) => p.color === to);

    if (recipient && recipient.isBot) {
      // Bot decides whether to accept
      setTimeout(
        async () => {
          try {
            const decision = await decideBotDMResponse(recipient, game, from);

            if (decision.accept) {
              // Bot accepts - use the shared accept handler
              handleDMAccept(io, gameId, from, to, recipient);
              console.log(
                `🤖 Bot ${recipient.name} accepted DM: ${decision.reason}`,
              );
            } else {
              // Bot rejects
              handleDMReject(io, gameId, from, to, decision.reason);
              console.log(
                `🤖 Bot ${recipient.name} rejected DM: ${decision.reason}`,
              );
            }
          } catch (error) {
            console.error("Bot DM decision error:", error);
            // Fallback to random decision
            if (Math.random() > 0.3) {
              handleDMAccept(io, gameId, from, to, recipient);
            } else {
              handleDMReject(io, gameId, from, to);
            }
          }
        },
        1500 + Math.random() * 2000,
      );
    }
  });

  socket.on("accept-dm", ({ gameId, from, to }) => {
    handleDMAccept(io, gameId, from, to);
  });

  socket.on("reject-dm", ({ gameId, from, to }) => {
    handleDMReject(io, gameId, from, to);
  });

  socket.on("send-dm-message", async ({ room, message, senderColor }) => {
    const messageData = {
      message,
      senderColor,
      timestamp: Date.now(),
    };

    // Store message in game state
    const [, gameId, color1, color2] = room.split("-");
    updateGame(gameId, (game) => {
      const dm = game.dms?.find((d) => d.room === room);
      if (dm) {
        dm.messages.push(messageData);
      }
    });

    // Send to room
    io.to(room).emit("dm-message-received", messageData);

    // Check if recipient is a bot
    const recipientColor = senderColor === color1 ? color2 : color1;
    const game = getGame(gameId);
    if (!game) return;

    const recipient = game.players.find((p) => p.color === recipientColor);

    if (recipient && recipient.isBot) {
      const thinkingTime = 2000 + Math.random() * 4000;

      setTimeout(() => {
        io.to(room).emit("dm-typing", {
          playerColor: recipientColor,
          isTyping: true,
        });
      }, 500);

      setTimeout(async () => {
        try {
          const currentGame = getGame(gameId);
          const dm = currentGame?.dms?.find((d) => d.room === room);
          const history = dm?.messages || [];

          const botMessage = await generateBotDMMessage(
            recipient,
            currentGame,
            senderColor,
            history,
          );

          const botMessageData = {
            message: botMessage,
            senderColor: recipientColor,
            timestamp: Date.now(),
          };

          // Store bot's message
          updateGame(gameId, (game) => {
            const dm = game.dms?.find((d) => d.room === room);
            if (dm) {
              dm.messages.push(botMessageData);
            }
          });

          io.to(room).emit("dm-typing", {
            playerColor: recipientColor,
            isTyping: false,
          });

          io.to(room).emit("dm-message-received", botMessageData);
          console.log(`💬 Bot DM Response: ${recipient.name} -> ${botMessage}`);
        } catch (error) {
          console.error("Bot DM response error:", error);
        }
      }, thinkingTime);
    }
  });

  socket.on("leave-dm", ({ room, gameId, playerColor }) => {
    socket.leave(room);
    io.to(room).emit("dm-ended", { playerColor });

    // Update game state
    updateGame(gameId, (game) => {
      const dm = game.dms?.find((d) => d.room === room);
      if (dm) {
        dm.status = "ended";
      }
    });
  });

  socket.on("disconnect", () => {
    const gameId = socket.data?.gameId;
    const playerColor = socket.data?.playerColor;

    if (gameId && playerColor) {
      const game = getGame(gameId);
      const playerDMs = game?.dms?.filter(
        (dm) => dm.participants.includes(playerColor) && dm.status === "active",
      );

      playerDMs?.forEach((dm) => {
        io.to(dm.room).emit("dm-ended", { playerColor });
        updateGame(gameId, (game) => {
          const foundDM = game.dms?.find((d) => d.room === dm.room);
          if (foundDM) {
            foundDM.status = "ended";
          }
        });
      });
    }
  });
};

// Helper functions
function handleDMAccept(io, gameId, from, to, botPlayer = null) {
  const room = `dm-${gameId}-${from}-${to}`;

  updateGame(gameId, (game) => {
    if (!game.dms) game.dms = [];

    game.dms.push({
      room,
      participants: [from, to],
      messages: [],
      status: "active",
      createdAt: Date.now(),
    });

    // Remove from pending
    game.pendingDMRequests = (game.pendingDMRequests || []).filter(
      (r) => !(r.from === from && r.to === to),
    );
  });

  // Get sockets and join room
  const sockets = Array.from(io.sockets.sockets.values());
  const fromSocket = sockets.find(
    (s) => s.data?.gameId === gameId && s.data?.playerColor === from,
  );
  const toSocket = sockets.find(
    (s) => s.data?.gameId === gameId && s.data?.playerColor === to,
  );

  if (fromSocket) fromSocket.join(room);
  if (toSocket) toSocket.join(room);

  io.to(gameId).emit("dm-accepted", { from, to });
  io.to(gameId).emit("dm-started", { from, to, room });

  // If bot accepted, send initial message
  if (botPlayer) {
    setTimeout(
      async () => {
        try {
          const game = getGame(gameId);
          const botMessage = await generateBotDMMessage(
            botPlayer,
            game,
            from,
            [],
          );

          const messageData = {
            message: botMessage,
            senderColor: to,
            timestamp: Date.now(),
          };

          updateGame(gameId, (game) => {
            const dm = game.dms?.find((d) => d.room === room);
            if (dm) {
              dm.messages.push(messageData);
            }
          });

          io.to(room).emit("dm-message-received", messageData);
          console.log(`💬 Bot DM: ${botPlayer.name} -> ${botMessage}`);
        } catch (error) {
          console.error("Bot initial DM error:", error);
        }
      },
      2000 + Math.random() * 3000,
    );
  }
}

function handleDMReject(io, gameId, from, to, reason = null) {
  updateGame(gameId, (game) => {
    game.pendingDMRequests = (game.pendingDMRequests || []).filter(
      (r) => !(r.from === from && r.to === to),
    );
  });

  io.to(gameId).emit("dm-rejected", { from, to, reason });
}
