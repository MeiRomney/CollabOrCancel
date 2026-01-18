import { useCallback, useEffect, useState } from "react";

export const useChatSocket = (socket, gameId, playerColor) => {
  const [messages, setMessages] = useState([]);
  const [typingPlayers, setTypingPlayers] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    socket.on("message-received", (data) => {
      console.log("Message received:", data);
      setMessages((prev) => [...prev, data]);

      // Remove typing indicator when a message is received
      setTypingPlayers((prev) => {
        const next = new Set(prev);
        next.delete(data.senderColor);
        return next;
      });
    });

    socket.on("player-typing", (data) => {
      console.log("Player typing:", data);
      if (data.isTyping) {
        setTypingPlayers((prev) => new Set([...prev, data.playerColor]));
      } else {
        setTypingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(data.playerColor);
          return next;
        });
      }
    });

    return () => {
      socket.off("message-received");
      socket.off("player-typing");
    };
  }, [socket]);

  const sendMessage = useCallback(
    (message) => {
      if (socket && gameId && playerColor) {
        socket.emit("send-message", {
          gameId,
          message,
          senderColor: playerColor,
        });

        // Immediately stops typing indicator for self
        setTypingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(playerColor);
          return next;
        });
      }
    },
    [socket, gameId, playerColor],
  );

  const setTyping = useCallback(
    (isTyping) => {
      if (socket && gameId && playerColor) {
        socket.emit("typing", {
          gameId,
          playerColor,
          isTyping,
        });
      }
    },
    [socket, gameId, playerColor],
  );

  return {
    messages,
    typingPlayers: Array.from(typingPlayers),
    sendMessage,
    setTyping,
  };
};
