import { useCallback, useEffect, useState } from "react";

export const useChatSocket = (socket, gameId, playerColor) => {
    const [messages, setMessages] = useState([]);
    const [typingPlayers, setTypingPlayers] = useState(new Set());

    useEffect(() => {
        if(!socket) return;

        socket.on('message-received', (data) => {
            setMessages(prev => [...prev, data]);
        });

        socket.on('player-typing', (data) => {
            if(data.isTyping) {
                setTypingPlayers(prev => new Set([...prev, data.playerColor]));
            } else {
                setTypingPlayers(prev => {
                    const next = new Set(prev);
                    next.delete(data.playerColor);
                    return;
                });
            }
        });

        return () => {
            socket.off('message-received');
            socket.off('player-typing');
        };
    }, [socket]);

    const sendMessages = useCallback((message) => {
        if(socket && gameId && playerColor) {
            socket.emit('send-message', {
                gameId,
                message,
                senderColor: playerColor
            });
        }
    }, [socket, gameId, playerColor]);

    const setTyping = useCallback((isTyping) => {
        if(socket && gameId && playerColor) {
            socket.emit('typing', {
                gameId,
                playerColor,
                isTyping
            });
        }
    }, [socket, gameId, playerColor]);

    return {
        messages,
        typingPlayers,
        sendMessages,
        setTyping
    };
};