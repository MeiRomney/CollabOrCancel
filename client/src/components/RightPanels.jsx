import React from "react";

const RightPanels = ({
  playerCharacter,
  otherPlayers = [],
  myPlayer = null,
}) => {
  // Create a unified player list
  const allPlayers = [];

  // Add current player first if provided
  if (myPlayer) {
    allPlayers.push(myPlayer);
  }

  // Add other players, filtering out duplicates
  const otherPlayerIds = new Set(allPlayers.map((p) => p.color || p.id));
  otherPlayers.forEach((player) => {
    if (!otherPlayerIds.has(player.color || player.id)) {
      allPlayers.push(player);
    }
  });

  return (
    <div
      className="absolute top-5 right-5 bg-white/10 p-5 rounded-3xl flex flex-col gap-0 max-h-[90vh] overflow-y-auto scrollbar-custom"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
      }}
    >
      <h3 className="text-white text-xl font-bold mb-2">All Players</h3>

      {allPlayers.map((player, index) => (
        <div
          key={index}
          className="p-2 flex gap-5 border-b border-white/20 last:border-b-0"
        >
          <img
            src={`/images/charactersFront/${player.color || player.id}.png`}
            alt={player.color || player.id}
            className="w-10"
          />
          <div>
            <p className="text-white text-lg">
              Color:{" "}
              <span className="font-bold capitalize">
                {player.color || player.id}
              </span>
            </p>
            {player.isHost && (
              <p className="text-yellow-300 text-sm font-bold">Host</p>
            )}
            {player.aura !== undefined && (
              <p className="text-white text-lg">
                Aura: <span className="font-bold">{player.aura}</span>
              </p>
            )}
            {player.vibe !== undefined && (
              <p className="text-white text-lg">
                Vibe: <span className="font-bold">{player.vibe}/2</span>
              </p>
            )}
            {player.alive === false && (
              <p className="text-red-400 text-sm font-bold">Eliminated</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RightPanels;
