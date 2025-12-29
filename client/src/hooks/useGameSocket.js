import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

let socket = null;

export const useGameSocket = (gameId, playerColor) => {
    const [gameState, setGameState] = useState(null);
    const [phase, setPhase] = useState('STARTING');
    const [round, setRound] = useState(1);
    const [phaseTimer, setPhaseTimer] = useState(null);
    const [myPlayer, setMyPlayer] = useState(null);
    const [otherPlayers, setOtherPlayers] = useState([]);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [collabProposals, setCollabProposals] = useState([]);
    const [roundResults, setRoundResults] = useState(null);

    // Initialize socket connection
    useEffect(() => {
        if(!gameId || !playerColor) return;

        socket = io('http://localhost:3001');

        socket.on('connect', () => {
            console.log("Connected to game server");
            socket.emit("join-game", {
                gameId, 
                player: { id: playerColor, color: playerColor }
            });
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
            setCurrentEvent(state.currentEvent);
        });

        socket.on('phase-changed', (data) => {
            console.log("Phase changed:", data);
            setPhase(data.phase);
            setPhaseTimer(data.timer);
            if(data.round) setRound(data.round);

            // Show phase notification
            const phaseNames = {
                'COLLAB_PROPOSAL': 'Collab Proposal Phase',
                'COLLAB_VOTING': 'Collab Voting Phase',
                'DM_PHASE': 'Direct Message Phase',
                'ACTION_PHASE': 'Action Phase',
                'RESOLUTION': 'Resolving Round...'
            };

            toast.success(`${phaseNames[data.phase] || data.phase}`);
        });

        socket.on("collab-proposed", (data) => {
            setCollabProposals(data.collabProposals);
        });

        socket.on('collab-vote-updated', (data) => {
            console.log("Collab vote updated:", data);
        });

        socket.on("collab-resolved", (results) =>{
            console.log("Collab resolved:", results)

            if(results.tie) {
                toast("Collab vote tied! All participants gain +1 Aura");
            } else if(results.winningCollab) {
                toast.success(`${results.winningCollab.proposer}'s collab won!`);
            }
        });

        socket.on("event-drawn", (data) => {
            setCurrentEvent(data.event);
            toast(
                <div>
                    <strong>Event: {data.event.name}</strong>
                    <p className="text-sm mt-1">{data.event.description}</p>
                </div>,
                { duration: 5000 }
            );
        });

        socket.on("round-resolved", (results) => {
            setRoundResults(results);

            // Show personal changes
            const myChanges = results.changes.filter(c => c.color === playerColor);
            myChanges.forEach(change => {
                if(change.eliminated) {
                    toast.error("You have been eliminated!");
                } else {
                    const changeText = [];
                    if(change.auraChange) {
                        const sign = change.auraChange > 0 ? '+' : '';
                        changeText.push(`${sign}${change.auraChange} Aura`);
                    }
                    if(change.vibeChange) {
                        const sign = change.vibeChange > 0 ? '+' : '';
                        changeText.push(`${sign}${change.vibeChange} Vibe`);
                    }
                    if(changeText.length > 0) {
                        toast(changeText.join(', ') + ` (${change.reason})`);
                    }
                }
            });

            // Update my player stats
            setMyPlayer(prev => {
                if(!prev) return prev;
                const myChange = myChanges[0];
                if(!myChange) return prev;

                return {
                    ...prev,
                    aura: prev.aura + (myChange.auraChange || 0),
                    vibe: prev.vibe + (myChange.vibeChange || 0),
                    alive: !myChange.eliminated
                };
            });
        });

        socket.on("game-over", (data) => {
            const isWinner = data.winners.some(w => w.color === playerColor);
            if(isWinner) {
                toast.success('🎉 YOU WIN! You are the Overlord!', { duration: 10000 });
            } else {
                toast.error('Game Over. Better luck next time!', { duration: 10000 });
            }
        });

        socket.on('player-joined', (data) => {
            toast(`${data.playerColor} joined game`);
        });

        return () => {
            if(socket) {
                socket.disconnect();
                socket = null;
            }
        };
    }, [gameId, playerColor]);

    // Actions
    const proposeCollab = useCallback(() => {
        if(socket && gameId && playerColor) {
            socket.emit('propose-collab', { gameId, proposerColor: playerColor });
        }
    }, [gameId, playerColor]);

    const voteCollab = useCallback((collabId) => {
        if(socket && gameId && playerColor) {
            socket.emit("vote-collab", {gameId, collabId, voterColor: playerColor});
        }
    }, [gameId, playerColor]);

    const submitAbility = useCallback((ability, target) => {
        if(socket && gameId && playerColor) {
            socket.emit('submit-ability', { gameId, ability, target, playerColor });
            toast.success(`${ability} action submitted`);
        }
    }, [gameId, playerColor]);

    const submitVote = useCallback((target) => {
        if(socket && gameId && playerColor) {
            socket.emit('submit-vote', { gameId, target, voterColor: playerColor });
            toast.success("Vote submitted");
        }
    }, [gameId, playerColor]);

    const saveNote = useCallback((note) => {
        if(socket && gameId && playerColor) {
            socket.emit('save-note', { gameId, playerColor, note });
        }
    }, [gameId, playerColor]);

    return {
        gameState,
        phase,
        round,
        phaseTimer,
        myPlayer,
        otherPlayers,
        currentEvent,
        collabProposals,
        roundResults,
        proposeCollab,
        voteCollab,
        submitAbility,
        submitVote,
        saveNote
    };
};