import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

export const useGameSocket = (socket, gameId, playerColor) => {
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState("STARTING");
  const [round, setRound] = useState(1);
  const [phaseTimer, setPhaseTimer] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [collabProposals, setCollabProposals] = useState([]);
  const [collabHost, setCollabHost] = useState("waiting");
  const [skipVotes, setSkipVotes] = useState([]);
  const [votes, setVotes] = useState({});
  const [roundResults, setRoundResults] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!socket || !gameId || !playerColor) return;

    socket.emit("join-gameplay", {
      gameId,
      player: { id: playerColor, color: playerColor },
    });

    socket.on("game-state", (state) => {
      console.log("Game state received:", state);
      setGameState(state);
      setPhase(state.phase);
      setRound(state.round);
      setPhaseTimer(state.phaseTimer);
      setMyPlayer(state.myPlayer);
      setOtherPlayers(state.otherPlayers);
      setCollabProposals(state.collabProposals || []);
      setSkipVotes(state.skipVotes || []);
      setVotes(state.votes || {});
      setCurrentEvent(state.currentEvent);
    });

    // Listen for game state updates (including updated player stats)
    socket.on("game-state-updated", (state) => {
      console.log("Game state updated:", state);
      setPhase(state.phase);
      setRound(state.round);
      setPhaseTimer(state.phaseTimer);

      // Support two possible shapes: { myPlayer, otherPlayers } or { players: [...] }
      if (state.players && Array.isArray(state.players)) {
        const players = state.players;
        const my = players.find(
          (p) => p.id === playerColor || p.color === playerColor,
        );
        setMyPlayer(my || null);
        setOtherPlayers(
          players.filter(
            (p) => !(p.id === playerColor || p.color === playerColor),
          ),
        );
      } else {
        setMyPlayer(state.myPlayer);
        setOtherPlayers(state.otherPlayers || []);
      }

      setCollabProposals(state.collabProposals || []);
      setSkipVotes(state.skipVotes || []);
      setVotes(state.votes || {});
      setCurrentEvent(state.currentEvent);
    });

    socket.on("phase-changed", (data) => {
      console.log("Phase changed:", data);
      setPhase(data.phase);
      setPhaseTimer(data.timer);
      if (data.round) setRound(data.round);

      // Show phase notification
      const phaseNames = {
        COLLAB_PROPOSAL: "Collab Proposal Phase",
        COLLAB_VOTING: "Collab Voting Phase",
        DM_PHASE: "Direct Message Phase",
        ACTION_PHASE: "Action Phase",
        RESOLUTION: "Resolving Round...",
      };

      toast.success(`${phaseNames[data.phase] || data.phase}`);
    });

    socket.on("collab-proposed", (data) => {
      console.log("Collab proposed:", data);
      setCollabProposals(data.proposals || []);
      setSkipVotes(data.skipVotes || []);

      if (data.proposals && data.proposals.length > 0) {
        const latestProposal = data.proposals[data.proposals.length - 1];
        if (latestProposal.proposer !== playerColor) {
          toast.success(`${latestProposal.proposer} proposed a collab!`, {
            icon: "🤝",
            duration: 2000,
          });
        }
      }
    });

    socket.on("collab-vote-updated", (data) => {
      console.log("Collab vote updated:", data);
      // Update local state for proposals and skip voters
      if (data.proposals) setCollabProposals(data.proposals);
      if (data.skipVotes) setSkipVotes(data.skipVotes);
    });

    socket.on("vote-updated", (data) => {
      console.log("Vote updated:", data);
      setVotes(data.votes || {});

      const voteCount = Object.keys(data.votes || {}).length;
      console.log(`${voteCount} votes submitted`);
    });

    socket.on("collab-resolved", (results) => {
      console.log("Collab resolved:", results);

      if (results.tie) {
        toast.success("Collab vote tied! All participants gain +1 Aura");
        setCollabHost("waiting");
      } else if (results.winningCollab) {
        toast.success(`${results.winningCollab.proposer}'s collab won!`);
        setCollabHost(results.winningCollab.proposer);
      }
    });

    socket.on("event-drawn", (data) => {
      setCurrentEvent(data.event);
    });

    socket.on("round-resolved", (results) => {
      setRoundResults(results);

      // Show personal changes
      const myChanges = results.changes.filter((c) => c.color === playerColor);
      myChanges.forEach((change) => {
        if (change.eliminated) {
          toast.error("You have been eliminated!");
        } else {
          const changeText = [];
          if (change.auraChange) {
            const sign = change.auraChange > 0 ? "+" : "";
            changeText.push(`${sign}${change.auraChange} Aura`);
          }
          if (change.vibeChange) {
            const sign = change.vibeChange > 0 ? "+" : "";
            changeText.push(`${sign}${change.vibeChange} Vibe`);
          }
          if (changeText.length > 0) {
            toast.success(changeText.join(", ") + ` (${change.reason})`);
          }
        }
      });

      // Update my player stats
      setMyPlayer((prev) => {
        if (!prev) return prev;
        const myChange = myChanges[0];
        if (!myChange) return prev;

        return {
          ...prev,
          aura: prev.aura + (myChange.auraChange || 0),
          vibe: prev.vibe + (myChange.vibeChange || 0),
          alive: !myChange.eliminated,
        };
      });

      setVotes({}); // Reset votes for next round
    });

    socket.on("game-over", (data) => {
      console.log("Game over:", data);
      setGameOverData(data);

      const isWinner = data.winners.some((w) => w.color === playerColor);
      if (isWinner) {
        toast.success("🎉 YOU WIN! You are the Overlord!", { duration: 10000 });
      } else {
        toast.error("Game Over. Better luck next time!", { duration: 10000 });
      }
    });

    socket.on("player-joined", (data) => {
      // toast(`${data.playerColor} joined game`);
      console.log(`${data.playerColor} joined game`);
    });

    socket.on("note-saved", (data) => {
      // Update myPlayer.note when saved successfully
      setMyPlayer((prev) => {
        if (!prev) return prev;
        return { ...prev, note: data.note };
      });
    });

    socket.on("stats-changed", (state) => {
      console.log("Stats changed:", state);
      // Update players with new aura/vibe values
      if (state.players && Array.isArray(state.players)) {
        const players = state.players;
        const my = players.find(
          (p) => p.id === playerColor || p.color === playerColor,
        );
        setMyPlayer(my || null);
        setOtherPlayers(
          players.filter(
            (p) => !(p.id === playerColor || p.color === playerColor),
          ),
        );
      }
    });

    socket.on("timer-updated", (data) => {
      console.log("Timer updated:", data);
      setPhaseTimer(data.phaseTimer);
      if (data.reason === "all_players_ready") {
        toast("All players ready! Phase ending soon...", { icon: "⏱️" });
      }
    });

    return () => {
      socket.off("game-state");
      socket.off("game-state-updated");
      socket.off("phase-changed");
      socket.off("collab-proposed");
      socket.off("collab-vote-updated");
      socket.off("vote-updated");
      socket.off("collab-resolved");
      socket.off("event-drawn");
      socket.off("round-resolved");
      socket.off("game-over");
      socket.off("player-joined");
      socket.off("note-saved");
      socket.off("stats-changed");
      socket.off("timer-updated");
    };
  }, [socket, gameId, playerColor]);

  // Actions
  const proposeCollab = useCallback(() => {
    if (socket && gameId && playerColor) {
      socket.emit("propose-collab", { gameId, proposerColor: playerColor });
    }
  }, [socket, gameId, playerColor]);

  const voteCollab = useCallback(
    (collabId) => {
      if (socket && gameId && playerColor) {
        socket.emit("vote-collab", {
          gameId,
          collabId,
          voterColor: playerColor,
        });
      }
    },
    [socket, gameId, playerColor],
  );

  const submitAbility = useCallback(
    (ability, target) => {
      if (socket && gameId && playerColor) {
        socket.emit("submit-ability", { gameId, ability, target, playerColor });
        toast.success(`${ability} action submitted`);
      }
    },
    [socket, gameId, playerColor],
  );

  const submitVote = useCallback(
    (target) => {
      if (socket && gameId && playerColor) {
        socket.emit("submit-vote", { gameId, target, voterColor: playerColor });
        toast.success("Vote submitted");
      }
    },
    [socket, gameId, playerColor],
  );

  const saveNote = useCallback(
    (note) => {
      if (socket && gameId && playerColor) {
        socket.emit("save-note", { gameId, playerColor, note });
      }
    },
    [socket, gameId, playerColor],
  );

  return {
    gameState,
    phase,
    round,
    phaseTimer,
    myPlayer,
    otherPlayers,
    currentEvent,
    collabProposals,
    collabHost,
    skipVotes,
    votes,
    roundResults,
    gameOverData,
    proposeCollab,
    voteCollab,
    submitAbility,
    submitVote,
    saveNote,
  };
};
