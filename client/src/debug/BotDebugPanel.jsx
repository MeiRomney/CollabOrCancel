import React, { useState, useEffect } from "react";

/**
 * BotDebugPanel - Shows what bots are doing in real-time
 * Add this component temporarily to your game screen to debug bot behavior
 */
export const BotDebugPanel = ({
  otherPlayers,
  collabProposals,
  skipVotes,
  votes,
  phase,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [botActions, setBotActions] = useState([]);

  useEffect(() => {
    // Track bot proposals
    if (collabProposals && collabProposals.length > 0) {
      const botProposals = collabProposals.filter((p) =>
        otherPlayers.some((player) => player.color === p.proposer),
      );

      botProposals.forEach((proposal) => {
        addAction(`🤖 ${proposal.proposer} proposed collab`, "proposal");
      });
    }
  }, [collabProposals, otherPlayers]);

  useEffect(() => {
    // Track bot votes
    if (votes && Object.keys(votes).length > 0) {
      Object.entries(votes).forEach(([voter, target]) => {
        const isBot = otherPlayers.some((p) => p.color === voter);
        if (isBot) {
          addAction(`🗳️ Bot ${voter} voted for ${target}`, "vote");
        }
      });
    }
  }, [votes, otherPlayers]);

  const addAction = (text, type) => {
    setBotActions((prev) => {
      // Avoid duplicates
      if (prev.some((a) => a.text === text)) return prev;

      return [
        { text, type, timestamp: Date.now() },
        ...prev.slice(0, 9), // Keep last 10 actions
      ];
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        🤖 Bot Debug
      </button>
    );
  }

  const bots = otherPlayers || [];
  const botCount = bots.length;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-white rounded-lg shadow-2xl p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">🤖 Bot Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Bot Count */}
      <div className="mb-3 p-2 bg-gray-800 rounded">
        <p className="text-sm">
          <span className="font-semibold">Bots Active:</span> {botCount}
        </p>
        <p className="text-xs text-gray-400">Phase: {phase}</p>
      </div>

      {/* Bot List */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-2 text-gray-400">BOTS:</p>
        <div className="space-y-1">
          {bots.map((bot) => (
            <div
              key={bot.color}
              className="text-xs p-2 bg-gray-800 rounded flex justify-between"
            >
              <span className={`font-semibold text-${bot.color}-400`}>
                {bot.color}
              </span>
              <span className="text-gray-400">
                A:{bot.aura} V:{bot.vibe}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Collab Proposals */}
      {phase === "COLLAB_PROPOSAL" &&
        collabProposals &&
        collabProposals.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold mb-2 text-gray-400">
              PROPOSALS:
            </p>
            <div className="space-y-1">
              {collabProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="text-xs p-2 bg-blue-900/30 rounded"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{proposal.proposer}</span>
                    <span className="text-gray-400">
                      {proposal.votes.length} votes
                    </span>
                  </div>
                  {proposal.votes.length > 0 && (
                    <div className="text-gray-400 mt-1">
                      {proposal.votes.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Skip Votes */}
            {skipVotes && skipVotes.length > 0 && (
              <div className="mt-2 text-xs p-2 bg-red-900/30 rounded">
                <span className="font-semibold">Skip Votes:</span>{" "}
                {skipVotes.join(", ")}
              </div>
            )}
          </div>
        )}

      {/* Voting Phase */}
      {phase === "VOTING_PHASE" && votes && Object.keys(votes).length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold mb-2 text-gray-400">VOTES:</p>
          <div className="space-y-1">
            {Object.entries(votes).map(([voter, target]) => (
              <div
                key={voter}
                className="text-xs p-2 bg-red-900/30 rounded flex justify-between"
              >
                <span className="font-semibold">{voter}</span>
                <span className="text-gray-400">→ {target}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {Object.keys(votes).length} / {bots.length + 1} votes in
          </div>
        </div>
      )}

      {/* Recent Actions */}
      <div>
        <p className="text-xs font-semibold mb-2 text-gray-400">
          RECENT ACTIONS:
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {botActions.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No bot actions yet...
            </p>
          ) : (
            botActions.map((action, index) => (
              <div
                key={index}
                className="text-xs p-2 bg-gray-800 rounded text-gray-300"
              >
                {action.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Watch this panel to see bot actions in real-time. Check browser
          console for detailed logs.
        </p>
      </div>
    </div>
  );
};

export default BotDebugPanel;
