import { createGame } from "../game/gameManager";

const activeLobbies = new Map();

export const registerMatchmakingSockets = (io,socket) => {
    // Get list of available games
    socket.on('get-games-list', () => {
        const gamesList = Array.from(activeLobbies.values()).map(lobby => ({
            id: lobby.gameId,
            hostName: lobby.hostName,
            hostColor: lobby.hostColor,
            playerCount: lobby.players.length,
            takenColors: lobby.players.map(p => p.color),
            createdAt: lobby.createdAt,
            status: lobby.status,
        }));

        socket.emit('games-list', gamesList);
    });

    // Create a new game
    socket.on('create-game', ({ gameId, hostName, hostColor }) => {
        console.log("Creating game:", { gameId, hostName, hostColor });

        // Create lobby
        const lobby = {
            gameId,
            hostId: socket.id,
            hostName, 
            hostColor,
            players: [{
                id: socket.id,
                name: hostName,
                color: hostColor,
                isHost: true
            }],
            status: 'waiting', // waiting, started
            createdAt: Date.now()
        };

        activeLobbies.set(gameId, lobby);

        // Join the socket room
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.playerColor = hostColor;
        socket.data.playerName = hostName;
        socket.data.isHost = true;

        // Emit success
        socket.on('game-created', {
            success: true,
            gameId, 
            lobby
        });

        // Broadcast updated game list to everyone
        io.emit('games-list-updated');

        console.log(`Game ${gameId} created by ${hostName}`);
    });

    // Join an existing game
    socket.on('join-game', ({ gameId, playerName, playerColor }) => {
        console.log('Player joining:', { gameId, playerName, playerColor });

        const lobby = activeLobbies.get(gameId);

        if(!lobby) {
            socket.emit('error', { message: 'Game not found!' });
            return;
        }

        if(lobby.status === 'started') {
            socket.emit('error', { message: 'Game already started!' });
            return;
        }

        if(lobby.players.length >= 8) {
            socket.emit('error', { message: 'Game is full!' });
            return;
        }

        // Check if color is taken
        if(lobby.players.some(p => p.color === playerColor)) {
            socket.emit('error', { message: `${playerColor} is already taken!` });
            return;
        }

        // Add player to lobby
        const newPlayer = {
            id: socket.id,
            name: playerName,
            color: playerColor,
            isHost: false
        };

        lobby.players.push(newPlayer);

        // Join socket room
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.playerColor = playerColor;
        socket.data.playerName = playerName;
        socket.data.isHost = false;

        // Notify the joining player
        socket.emit('game-joined', {
            success: true, 
            gameId,
            lobby
        });

        // Notify all players in the lobby
        socket.emit('player-joined-lobby', {
            player: newPlayer,
            totalPlayers: lobby.players.length
        });

        // Broadcast updated game list
        io.emit('games-list-updated');

        console.log(`${playerName} joined game ${gameId}`);
    });

    // Player change color in lobby
    socket.on('change-color', ({ gameId, newColor }) => {
        const lobby = activeLobbies.get(gameId);

        if(!lobby) return;

        const player = lobby.players.find(p => p.id === socket.id);
        if(!player) return;

        // Check if color is taken
        if(lobby.players.some(p => p.color === newColor && p.id !== socket.id)) {
            socket.emit('error', { message: `${newColor} is already taken!` });
            return;
        }

        const oldColor = player.color;
        player.color = newColor;
        socket.data.playerColor = newColor;

        // Notify all players in lobby
        io.to(gameId).emit('player-color-changed', {
            playerId: socket.id,
            playerName: player.name, 
            oldColor,
            newColor
        });

        // Broadcast updated games list
        io.emit('games-list-updated');
    });

    // Start the game (host only)
    socket.on('start-game', ({ gameId }) => {
        const lobby = activeLobbies.get(gameId);

        if(!lobby) {
            socket.emit('error', { message: 'Game not found!' });
            return;
        }

        if(socket.id !== lobby.hostId) {
            socket.emit('error', { message: 'Only the host can start the game!' });
            return;
        }

        // Mark lobby as started
        lobby.status = 'started';

        // Create actual game state
        createGame(gameId, lobby.players.map(p => ({
            id: p.color,
            color: p.color,
            name: p.name
        })));

        // Notify all players to transition to gameplay
        io.to(gameId).emit('game-starting', {
            gameId,
            players: lobby.players
        });

        // Remove from active lobbies after a short delay
        setTimeout(() => {
            activeLobbies.delete(gameId);
            io.emit('games-list-updated');
        }, 2000);

        console.log(`Game ${gameId} started with ${lobby.players.length} players`);
    });

    // Leave lobby
    socket.on('leave-lobby', ({ gameId }) => {
        handlePlayerLeave(io, socket, gameId);
    });

    // Handle disconnect 
    socket.on('disconnect', () => {
        const gameId = socket.data.gameId;
        if(gameId) {
            handlePlayerLeave(io, socket, gameId);
        }
    });
};

// Helper function to handle players leaving
function handlePlayerLeave(io, socket, gameId) {
    const lobby = activeLobbies.get(gameId);
    if(!lobby) return;

    const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
    if(playerIndex === -1) return;

    const player = lobby.players[playerIndex];
    lobby.players.splice(playerIndex, 1);

    // If host left, assign new host or delete lobby
    if(socket.id === lobby.hostId) {
        if(lobby.players.length > 0) {
            // Assign new host
            const newHost = lobby.players[0];
            lobby.hostId = newHost.id;
            newHost.isHost = true;
            lobby.hostName = newHost.name;
            lobby.hostColor = newHost.color;

            io.to(gameId).emit('new-host', {
                hostId: newHost.id,
                hostName: newHost.name,
                hostColor: newHost.color
            });
        } else {
            // Delete empty lobby
            activeLobbies.delete(gameId);
        }
    }

    // Notify remaining players
    io.to(gameId).emit('player-left-lobby', {
        playerId: socket.id,
        playerName: player.name,
        playerColor: player.color,
        remainingPlayers: lobby.players.length
    });

    // Broadcast game list
    io.emit('games-list-updated');

    socket.leave(gameId);
    console.log(`${player.name} left game ${gameId}`);
}