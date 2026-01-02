import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import BackgroundImage from "/images/matchMakingBackground.png";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const MatchMakingPage = () => {
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [gameIdInput, setGameIdInput] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("red");

  const allColors = [
    { name: "red", hex: "#ef4444" },
    { name: "blue", hex: "#3b82f6" },
    { name: "green", hex: "#22c55e" },
    { name: "pink", hex: "#ec4899" },
    { name: "orange", hex: "#f97316" },
    { name: "yellow", hex: "#eab308" },
    { name: "black", hex: "#000000" },
    { name: "white", hex: "#ffffff" },
    { name: "purple", hex: "#a855f7" },
    { name: "brown", hex: "#92400e" },
    { name: "cyan", hex: "#06b6d4" },
    { name: "lime", hex: "#84cc16" },
    { name: "maroon", hex: "#7f1d1d" },
    { name: "rose", hex: "#fb7185" },
    { name: "banana", hex: "#fef08a" },
    { name: "gray", hex: "#6b7280" },
    { name: "tan", hex: "#d2b48c" },
    { name: "coral", hex: "#ff7f50" }
  ];

  const backgroundStyle = {
    backgroundImage: `url(${BackgroundImage})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "100vw",
    height: "100vh",
    position: "relative",
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Listen for available games list
    newSocket.on('games-list', (games) => {
      setAvailableGames(games);
    });

    newSocket.on('game-created', (data) => {
      console.log('Game created:', data);
    });

    newSocket.on('game-joined', (data) => {
      console.log('Game joined:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });

    // Request games list on mount
    newSocket.emit('get-games-list');

    // Refresh games list every 3 seconds
    const interval = setInterval(() => {
      newSocket.emit('get-games-list');
    }, 3000);

    return () => {
      clearInterval(interval);
      newSocket.close();
    };
  }, []);

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name!");
      return;
    }

    // Generate a unique game ID
    const newGameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Emit create game event
    if (socket) {
      socket.emit('create-game', {
        gameId: newGameId,
        hostName: playerName,
        hostColor: selectedColor
      });

      // Store game info in sessionStorage for lobby page
      sessionStorage.setItem('gameId', newGameId);
      sessionStorage.setItem('playerColor', selectedColor);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('isHost', 'true');

      toast.success("Game created! Redirecting to lobby...");
      
      setTimeout(() => {
        navigate("/lobby");
      }, 1000);
    }
  };

  const handleJoinGame = (gameId) => {
    if (!playerName.trim()) {
      toast.error("Please enter your name!");
      return;
    }

    if (!gameId) {
      toast.error("Please enter a game ID!");
      return;
    }

    // Check if game exists in available games
    const game = availableGames.find(g => g.id === gameId);
    
    if (!game) {
      toast.error("Game not found!");
      return;
    }

    if (game.playerCount >= 8) {
      toast.error("Game is full!");
      return;
    }

    // Check if color is taken
    if (game.takenColors && game.takenColors.includes(selectedColor)) {
      toast.error(`${selectedColor} is already taken in this game!`);
      return;
    }

    // Emit join game event
    if (socket) {
      socket.emit('join-game', {
        gameId,
        playerName,
        playerColor: selectedColor
      });

      // Store game info in sessionStorage for lobby page
      sessionStorage.setItem('gameId', gameId);
      sessionStorage.setItem('playerColor', selectedColor);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('isHost', 'false');

      toast.success("Joining game...");
      
      setTimeout(() => {
        navigate("/lobby");
      }, 1000);
    }
  };

  const handleQuickJoin = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name!");
      return;
    }

    // Find first available game with space
    const availableGame = availableGames.find(game => 
      game.playerCount < 8 && 
      (!game.takenColors || !game.takenColors.includes(selectedColor))
    );

    if (availableGame) {
      handleJoinGame(availableGame.id);
    } else {
      toast.error("No available games found. Create a new one!");
    }
  };

  return (
    <div style={backgroundStyle}>
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid white",
              color: "white",
              fontSize: "18px",
              padding: "12px 20px",
              borderRadius: "12px",
            },
            iconTheme: {
              primary: "#4ade80",
              secondary: "white",
            },
          },
          error: {
            style: {
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid white",
              color: "white",
              fontSize: "18px",
              padding: "12px 20px",
              borderRadius: "12px",
            },
            iconTheme: {
              primary: "#f87171",
              secondary: "white",
            },
          },
        }}
      />

      {/* Title */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center">
        <h1 className="text-6xl font-bold text-white drop-shadow-lg">
          MATCHMAKING
        </h1>
        <p className="text-2xl text-white/80 mt-2">
          Create or Join a Game
        </p>
      </div>

      {/* Main Container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] flex flex-col gap-6">
        
        {/* Player Name Input */}
        <div className="bg-black/30 backdrop-blur-md border-white border-2 rounded-3xl p-6">
          <label className="text-white text-xl font-bold block mb-3">
            Enter Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name..."
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl text-xl bg-white/20 backdrop-blur-sm border-2 border-white text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        {/* Color Selection */}
        <div className="bg-black/30 backdrop-blur-md border-white border-2 rounded-3xl p-6">
          <label className="text-white text-xl font-bold block mb-3">
            Select Your Color
          </label>
          <div className="grid grid-cols-9 gap-3">
            {allColors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                className={`
                  w-12 h-12 rounded-full relative
                  transition-all duration-300
                  hover:scale-110 cursor-pointer
                  ${selectedColor === color.name ? 'ring-4 ring-white scale-110' : ''}
                `}
                style={{
                  backgroundColor: color.hex,
                  border: color.name === 'white' ? '2px solid #gray' : '2px solid white',
                }}
                title={color.name}
              >
                {selectedColor === color.name && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl" style={{ 
                      color: color.name === 'white' || color.name === 'yellow' || color.name === 'banana' ? 'black' : 'white' 
                    }}>
                      ✓
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600/80 backdrop-blur-md border-white border-2 rounded-2xl p-6 text-white text-xl font-bold hover:bg-green-600 hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <div className="text-4xl mb-2">🎮</div>
            CREATE GAME
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-blue-600/80 backdrop-blur-md border-white border-2 rounded-2xl p-6 text-white text-xl font-bold hover:bg-blue-600 hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <div className="text-4xl mb-2">🚪</div>
            JOIN GAME
          </button>

          <button
            onClick={handleQuickJoin}
            className="bg-purple-600/80 backdrop-blur-md border-white border-2 rounded-2xl p-6 text-white text-xl font-bold hover:bg-purple-600 hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <div className="text-4xl mb-2">⚡</div>
            QUICK JOIN
          </button>
        </div>

        {/* Available Games */}
        <div className="bg-black/30 backdrop-blur-md border-white border-2 rounded-3xl p-6 max-h-64 overflow-y-auto">
          <h3 className="text-white text-xl font-bold mb-4">
            Available Games ({availableGames.length})
          </h3>
          {availableGames.length === 0 ? (
            <p className="text-white/60 text-center py-4">
              No active games. Create one to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/20 transition-all"
                >
                  <div>
                    <p className="text-white font-bold">{game.hostName}'s Game</p>
                    <p className="text-white/60 text-sm">
                      Players: {game.playerCount}/8 • ID: {game.id.substring(0, 12)}...
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinGame(game.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all"
                    disabled={game.playerCount >= 8}
                  >
                    {game.playerCount >= 8 ? 'FULL' : 'JOIN'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md border-white border-2 rounded-3xl p-8 w-[500px]">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Create New Game
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-white text-lg mb-2">
                  <span className="font-bold">Name:</span> {playerName || "Not set"}
                </p>
                <p className="text-white text-lg mb-2">
                  <span className="font-bold">Color:</span> 
                  <span 
                    className="inline-block w-6 h-6 rounded-full ml-2 align-middle"
                    style={{ 
                      backgroundColor: allColors.find(c => c.name === selectedColor)?.hex,
                      border: '2px solid white'
                    }}
                  />
                  <span className="ml-2 capitalize">{selectedColor}</span>
                </p>
                <p className="text-white/60 text-sm mt-4">
                  You will be the host of this game and can start it when ready.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateGame}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition-all"
                >
                  CREATE & HOST
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Game Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md border-white border-2 rounded-3xl p-8 w-[500px]">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Join Existing Game
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-lg font-bold block mb-2">
                  Game ID
                </label>
                <input
                  type="text"
                  value={gameIdInput}
                  onChange={(e) => setGameIdInput(e.target.value)}
                  placeholder="Enter game ID..."
                  className="w-full px-4 py-3 rounded-xl text-lg bg-white/20 backdrop-blur-sm border-2 border-white text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <p className="text-white text-lg mb-2">
                  <span className="font-bold">Your Name:</span> {playerName || "Not set"}
                </p>
                <p className="text-white text-lg mb-2">
                  <span className="font-bold">Your Color:</span> 
                  <span 
                    className="inline-block w-6 h-6 rounded-full ml-2 align-middle"
                    style={{ 
                      backgroundColor: allColors.find(c => c.name === selectedColor)?.hex,
                      border: '2px solid white'
                    }}
                  />
                  <span className="ml-2 capitalize">{selectedColor}</span>
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleJoinGame(gameIdInput)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all"
                >
                  JOIN GAME
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setGameIdInput("");
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute bottom-8 left-8 bg-red-600/80 backdrop-blur-md border-white border-2 rounded-2xl px-6 py-4 text-white text-xl font-bold hover:bg-red-600 hover:scale-105 transition-all duration-300 active:scale-95"
      >
        ← BACK
      </button>
    </div>
  );
};

export default MatchMakingPage;