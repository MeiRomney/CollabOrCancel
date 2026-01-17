import { Check, X } from "lucide-react";
import React, { useState } from "react";

const CollabVote = ({
  playerColor,
  proposals = [],
  skipVotes = [],
  onVote,
  onClose,
}) => {
  // const proposers = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white"];
  // const voters = ["red", "blue", "green", "pink", "orange", "yellow", "black", "white"];
  // const SKIP = "skip";
  // const mockVotes = {
  //     red: "blue",
  //     blue: "red",
  //     green: "red",
  //     pink: "yellow",
  //     orange: "red",
  //     yellow: "blue",
  //     black: "red",
  //     white: "green",
  // };

  // const [votes, setVotes] = useState(mockVotes);
  const [pendingVote, setPendingVote] = useState(null);
  const [myVote, setMyVote] = useState(null);

  const handleVoteClick = (collabId) => {
    setPendingVote(collabId);
  };

  const confirmVote = (e) => {
    e.stopPropagation();
    setMyVote(pendingVote);
    onVote(pendingVote);
    setPendingVote(null);
  };

  const cancelVote = (e) => {
    e.stopPropagation();
    setPendingVote(null);
  };

  return (
    <div
      className="fixed w-96 h-96 bg-black/60 backdrop-blur-md rounded-2xl border border-white p-3 flex flex-col overflow-hidden shadow-xl z-50"
      style={{
        left: "35%",
        top: "10%",
        width: "400px",
        height: "400px",
      }}
    >
      {/* Header */}
      <div className="chat-header cursor-move text-white text-xl font-bold p-2 bg-white/10 rounded-xl mb-2 flex justify-between">
        <p>Collab Voting</p>
        <button
          className="cursor-pointer bg-transparent hover:bg-white/20 transition-all duration-500 rounded-md"
          onClick={onClose}
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Vote options */}
      <div
        className="scrollbar-custom flex-1 overflow-y-auto flex flex-col gap-3 p-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
        }}
      >
        {proposals.length === 0 ? (
          <div className="text-white/70 text-center py-8">
            No collab proposals yet
          </div>
        ) : (
          proposals.map((proposal) => {
            const votedForThis = myVote === proposal.id;
            const isPending = pendingVote === proposal.id;

            return (
              <div
                key={proposal.id}
                onClick={() => handleVoteClick(proposal.id)}
                className={`relative cursor-pointer bg-white/20 p-3 rounded-xl text-white transition-all
                                    ${votedForThis ? "ring-2 ring-green-400 scale-[1.02]" : "hover:bg-white/30"}
                                `}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side */}
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={`/images/charactersHead/${proposal.proposer}.png`}
                        className="w-12 h-12 rounded-full"
                      />
                      <p className="text-lg font-semibold opacity-80">
                        {proposal.proposer}
                      </p>
                    </div>

                    {/* Voters */}
                    <div className="flex flex-wrap gap-2 pl-14">
                      {(proposal.votes || []).map((voter) => (
                        <img
                          key={voter}
                          src={`/images/charactersHead/${voter}.png`}
                          className="w-8 h-8 rounded-full"
                          alt={voter}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right side – confirm / cancel */}
                  {isPending && (
                    <div
                      className="flex gap-2 p-5 my-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="text-green-400 hover:scale-110 hover:bg-white/10 rounded-xl transition"
                        onClick={confirmVote}
                      >
                        <Check className="w-10 h-10" />
                      </button>
                      <button
                        className="text-red-400 hover:scale-110 hover:bg-black/30 rounded-xl transition"
                        onClick={cancelVote}
                      >
                        <X className="w-10 h-10" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Skip option */}
        <div
          onClick={() => handleVoteClick("skip")}
          className={`relative cursor-pointer bg-white/20 p-3 rounded-xl text-white transition-all
                    ${myVote === "skip" ? "ring-2 ring-yellow-400 scale-[1.02]" : "hover:bg-white/30"}
                `}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side */}
            {/* <div className="flex flex-col gap-2 flex-1">
                        <p className="text-lg font-semibold opacity-80 pl-14">Skip Vote</p>
                        <p className="text-sm opacity-60 pl-14">Cannot be defended by collab host this round</p>
                    </div> */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-lg font-bold">
                  ⊘
                </div>
                <p className="text-lg font-semibold opacity-80 pl-5">
                  Skip Vote
                </p>
                <p className="text-sm opacity-60 pl-5">
                  Cannot be defended by collab host this round
                </p>
              </div>

              {/* Voters */}
              <div className="flex flex-wrap gap-2 pl-14">
                {skipVotes.map((voter) => (
                  <img
                    key={voter}
                    src={`/images/charactersHead/${voter}.png`}
                    className="w-8 h-8 rounded-full"
                    alt={voter}
                  />
                ))}
              </div>
            </div>

            {/* Right side – confirm / cancel */}
            {pendingVote === "skip" && (
              <div
                className="flex gap-2 p-5 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="text-green-400 hover:scale-110 hover:bg-white/10 rounded-xl transition"
                  onClick={confirmVote}
                >
                  <Check className="w-10 h-10" />
                </button>
                <button
                  className="text-red-400 hover:scale-110 hover:bg-black/30 rounded-xl transition"
                  onClick={cancelVote}
                >
                  <X className="w-10 h-10" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabVote;
