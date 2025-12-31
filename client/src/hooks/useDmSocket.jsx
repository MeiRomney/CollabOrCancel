import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast';

export const useDmSocket = (socket, gameId, playerColor) => {
    const [dmRequests, setDmRequests] = useState([]);
    const [activeDm, setActiveDm] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);

    useEffect(() => {
        if(!socket) return;

        socket.on('dm-requested', (data) => {
            if(data.to === playerColor) {
                setDmRequests(prev => [...prev, data]);
                toast(
                    `${data.from} wants to DM you`,
                    {
                        duration: 10000,
                        icon: '💬'
                    }
                );
            }
        });

        socket.on('dm-started', (data) => {
            if(data.from === playerColor || data.to === playerColor) {
                setActiveDm(data);
                setDmMessages([]);
                toast.success('DM started');
            }
        });

        socket.on('dm-accepted', (data) => {
            setDmRequests(prev => prev.filter(r => !(r.from === data.from && r.to === data.to)));
        });

        socket.on('dm-rejected', (data) => {
            setDmRequests(prev => prev.filter(r => !(r.from === data.from && r.to === data.to)));
            if(data.from === playerColor) {
                toast.error(`${data.to} rejected your DM request`);
            }
        });

        socket.on('dm-message-received', (data) => {
            setDmMessages(prev => [...prev, data]);
        });

        socket.on('dm-ended', (data) => {
            setActiveDm(null);
            setDmMessages([]);
            toast('DM ended');
        });

        return () => {
            socket.off('dm-requested');
            socket.off('dm-started');
            socket.off('dm-accepted');
            socket.off('dm-rejected');
            socket.off('dm-message-received');
            socket.off('dm-ended');
        };
    }, [socket, playerColor]);

    const requestDm = useCallback((targetColor) => {
        if(socket && gameId && playerColor) {
            socket.emit('request-dm', { gameId, from: playerColor, to: targetColor });
        }
    }, [socket, gameId, playerColor]);

    const acceptDm = useCallback((request) => {
        if(socket && gameId) {
            socket.emit('accept-dm', { gameId, from: request.from, to: request.to });
        }
    }, [socket, gameId]);

    const rejectDm = useCallback((request) => {
        if(socket && gameId) {
            socket.emit('reject-dm', { gameId, from: request.from, to: request.to });
            setDmRequests(prev => prev.filter(r => r !== request));
        }
    }, [socket, gameId]);

    const sendDmMessage = useCallback((message) => {
        if(socket  && activeDm) {
            socket.emit('send-dm-message', {
                room: activeDm.room,
                message,
                senderColor: playerColor
            });
        }
    }, [socket, activeDm, playerColor]);

    const leaveDm = useCallback(() => {
        if(socket && activeDm && gameId && playerColor) {
            socket.emit('leave-dm', {
                room: activeDm.room,
                gameId,
                playerColor
            });
            setActiveDm(null);
            setDmMessages([]);
        }
    }, [socket, activeDm, gameId, playerColor]);

    return {
        dmRequests,
        activeDm,
        dmMessages,
        requestDm, 
        acceptDm,
        rejectDm,
        sendDmMessage,
        leaveDm
    };
};
