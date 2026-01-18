// dmSockets.js - Enhanced with Bot AI responses
import { getGame } from "../game/gameManager.js";
import { decideBotDMResponse, generateBotDMMessage } from "../ai/botAIChat.js";

// Store active DM conversations and message history
const dmConversations = new Map();

export const registerDmSockets = (io, socket) => {
  socket.on("request-dm", async ({ gameId, from, to }) => {
    // Emit to entire game room so front end can show the request
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
              // Bot accepts DM
              const dmRoom = `dm-${gameId}-${from}-${to}`;

              // Get sockets for both players
              const sockets = Array.from(io.sockets.sockets.values());
              const fromSocket = sockets.find(
                (s) =>
                  s.data?.gameId === gameId && s.data?.playerColor === from,
              );
              const toSocket = sockets.find(
                (s) => s.data?.gameId === gameId && s.data?.playerColor === to,
              );

              if (fromSocket && toSocket) {
                fromSocket.join(dmRoom);
                toSocket.join(dmRoom);

                // Initialize conversation history
                dmConversations.set(dmRoom, []);

                // Notify both players that DM started
                io.to(gameId).emit("dm-started", { from, to, room: dmRoom });
                io.to(gameId).emit("dm-accepted", { from, to });

                console.log(
                  `🤖 Bot ${recipient.name} accepted DM: ${decision.reason}`,
                );

                // Bot sends first message after a delay
                setTimeout(
                  async () => {
                    try {
                      const botMessage = await generateBotDMMessage(
                        recipient,
                        game,
                        from,
                        dmConversations.get(dmRoom) || [],
                      );

                      const messageData = {
                        message: botMessage,
                        senderColor: to,
                        timestamp: Date.now(),
                      };

                      // Store in history
                      const history = dmConversations.get(dmRoom) || [];
                      history.push(messageData);
                      dmConversations.set(dmRoom, history);

                      io.to(dmRoom).emit("dm-message-received", messageData);

                      console.log(
                        `💬 Bot DM: ${recipient.name} -> ${botMessage}`,
                      );
                    } catch (error) {
                      console.error("Bot DM message error:", error);
                    }
                  },
                  2000 + Math.random() * 3000,
                );
              }
            } else {
              // Bot rejects DM
              io.to(gameId).emit("dm-rejected", {
                from,
                to,
                reason: decision.reason,
              });
              console.log(
                `🤖 Bot ${recipient.name} rejected DM: ${decision.reason}`,
              );
            }
          } catch (error) {
            console.error("Bot DM decision error:", error);
            // Fallback to random decision
            if (Math.random() > 0.3) {
              io.to(gameId).emit("dm-accepted", { from, to });
            } else {
              io.to(gameId).emit("dm-rejected", { from, to });
            }
          }
        },
        1500 + Math.random() * 2000,
      ); // Bot thinks for 1.5-3.5 seconds
    }
  });

  socket.on("accept-dm", ({ gameId, from, to }) => {
    // Create a private room for these two players
    const dmRoom = `dm-${gameId}-${from}-${to}`;

    // Get sockets for both players
    const sockets = Array.from(io.sockets.sockets.values());
    const fromSocket = sockets.find(
      (s) => s.data?.gameId === gameId && s.data?.playerColor === from,
    );
    const toSocket = sockets.find(
      (s) => s.data?.gameId === gameId && s.data?.playerColor === to,
    );

    if (fromSocket && toSocket) {
      fromSocket.join(dmRoom);
      toSocket.join(dmRoom);

      // Initialize conversation history
      dmConversations.set(dmRoom, []);

      // Notify both players that DM started
      io.to(gameId).emit("dm-started", { from, to, room: dmRoom });
    }

    // Notify game room that DM was accepted
    io.to(gameId).emit("dm-accepted", { from, to });
  });

  socket.on("reject-dm", ({ gameId, from, to }) => {
    io.to(gameId).emit("dm-rejected", { from, to });
  });

  socket.on("send-dm-message", async ({ room, message, senderColor }) => {
    const messageData = {
      message,
      senderColor,
      timestamp: Date.now(),
    };

    // Store message in history
    const history = dmConversations.get(room) || [];
    history.push(messageData);
    dmConversations.set(room, history);

    // Send to room
    io.to(room).emit("dm-message-received", messageData);

    // Check if recipient is a bot and generate response
    const [, gameId, color1, color2] = room.split("-");
    const recipientColor = senderColor === color1 ? color2 : color1;

    const game = getGame(gameId);
    if (!game) return;

    const recipient = game.players.find((p) => p.color === recipientColor);

    if (recipient && recipient.isBot) {
      // Bot responds after reading the message
      const thinkingTime = 2000 + Math.random() * 4000; // 2-6 seconds

      // Show typing indicator
      setTimeout(() => {
        io.to(room).emit("dm-typing", {
          playerColor: recipientColor,
          isTyping: true,
        });
      }, 500);

      setTimeout(async () => {
        try {
          const botMessage = await generateBotDMMessage(
            recipient,
            game,
            senderColor,
            history,
          );

          const botMessageData = {
            message: botMessage,
            senderColor: recipientColor,
            timestamp: Date.now(),
          };

          // Store bot's message
          history.push(botMessageData);
          dmConversations.set(room, history);

          // Stop typing indicator
          io.to(room).emit("dm-typing", {
            playerColor: recipientColor,
            isTyping: false,
          });

          // Send message
          io.to(room).emit("dm-message-received", botMessageData);

          console.log(`💬 Bot DM Response: ${recipient.name} -> ${botMessage}`);
        } catch (error) {
          console.error("Bot DM response error:", error);
          // Fallback response
          io.to(room).emit("dm-message-received", {
            message: "Interesting...",
            senderColor: recipientColor,
            timestamp: Date.now(),
          });
        }
      }, thinkingTime);
    }
  });

  socket.on("leave-dm", ({ room, gameId, playerColor }) => {
    socket.leave(room);
    io.to(room).emit("dm-ended", { playerColor });

    // Clean up conversation history after a delay
    setTimeout(() => {
      dmConversations.delete(room);
    }, 5000);
  });

  // Handle disconnect - clean up DM rooms
  socket.on("disconnect", () => {
    // Find and clean up any DM rooms this socket was in
    const gameId = socket.data?.gameId;
    const playerColor = socket.data?.playerColor;

    if (gameId && playerColor) {
      // Find DM rooms for this player
      dmConversations.forEach((history, room) => {
        if (room.includes(gameId) && room.includes(playerColor)) {
          io.to(room).emit("dm-ended", { playerColor });
          setTimeout(() => dmConversations.delete(room), 5000);
        }
      });
    }
  });
};
