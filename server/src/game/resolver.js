export const resolveRound = (game) => {
    const changes = [];
    const events = [];

    // 1. Resolve abilities (attacks, heals, defends, sabotages)
    const abilityResults = resolveAbilities(game);
    changes.push(...abilityResults.changes);
    events.push(...abilityResults.events);

    // 2. Resolve votes
    const voteResults = resolveVotes(game);
    changes.push(...voteResults.changes);
    events.push(...voteResults.events);

    // 3. Apply event effects
    if(game.currentEvent) {
        const eventChanges = applyEventEffect(game);
        if(eventChanges.changes) {
            changes.push(...eventChanges.changes);
        }
        if(eventChanges.reveal) {
            events.push({
                type: "event-reveal",
                data: eventChanges.reveal
            });
        }
    }

    // 4. Check for elimination
    game.players.forEach(player => {
        const totalAuraChange = changes
            .filter(c => c.color === player.color && c.auraChange)
            .reduce((sum, c) => sum + c.auraChange, 0);

        if(player.aura += totalAuraChange <= -5) {
            changes.push({
                color: player.color,
                eliminated: true,
                reason: "Aura dropped below -5"
            });
            events.push({
                type: "elimination",
                player: player.color,
                reason: "Low Aura"
            });
        }
    });

    return { changes, events };
};

function applyEventEffect(game) {
    const event = game.currentEvent;

    if(event.effect) {
        const result = event.effect(game);
        return { changes: result.changes || result, reveal: result.reveal };
    }

    return { changes: [] };
}

function resolveAbilities(game) {
    const changes = [];
    const events = [];
    const abilities = game.abilites || {};
    const collabHost = game.collabHost;
    const currentEvent = game.currentEvent;

    // Check event modifiers
    const healingBoost = currentEvent?.modifier === "healing-boost";
    const invisibleSabotage = currentEvent?.modifier === "invisible-sabotage";
    const firstAttackImmune = currentEvent?.modifier === "first-attack-immune";
    const revealAttacks = currentEvent?.modifier === "reveal-attacks";

    let firstAttackUsed = false;

    Object.entries(abilities).forEach(([actorColor, action]) => {
        const actor = game.players.find(p => p.color === actorColor);
        const target = game.players.find(p => p.color === action.target);

        if(!actor || !target) return;

        switch(action.abilities) {
            case "attack":
                // Check if target is defended
                const defender = Object.entries(abilities).find(
                    ([color, a]) => a.abilities === "defend" && a.target === target.color
                );

                const isImmune = firstAttackImmune && !firstAttackUsed;
                if(isImmune) firstAttackUsed = true;

                if(defender || target.color === collabHost || isImmune) {
                    // Attack blocked
                    events.push({
                        type: "attack-blocked",
                        attacker: actorColor,
                        target: target.color,
                        defender: defender ? defender[0] : isImmune ? "event" : "collab-host",
                        visible: revealAttacks
                    });
                    
                    if(defender) {
                        changes.push({
                            color: defender[0],
                            auraChange: 1,
                            reason: "Defended against attack"
                        });
                    }
                } else {
                    const damageMultiplier = target.buffedAttack ? 2 : 1;
                    // Attack succeeds
                    changes.push({
                        color: target.color,
                        vibeChange: -1 * damageMultiplier,
                        auraChange: -1 * damageMultiplier,
                        reason: "attacked"
                    });

                    if(target.buffedAttack) {
                        target.buffedAttack = false;
                    }

                    events.push({
                        type: "attack",
                        attacker: actorColor,
                        target: target.color,
                        damage: damageMultiplier,
                        visible: revealAttacks
                    });
                }
                break;
            
            case "heal": 
                const needsHealing = target.vibe < 2;

                if(needsHealing || healingBoost) {
                    changes.push({
                        color: actorColor,
                        auraChange: 1,
                        reason: healingBoost ? "Heal (event boos)" : "Successful heal"
                    });
                    changes.push({
                        color: target.color,
                        vibeChange: Math.min(1, 2 - target.vibe),
                        reason: "Healed"
                    });
                } else {
                    // Wrong heal
                    changes.push({
                        color: actorColor,
                        auraChange: -1,
                        reason: "Wrong heal"
                    });
                    changes.push({
                        color: target.color,
                        auraChange: 1,
                        reason: "Healed while full HP"
                    });

                    if(target.role === "doomer") {
                        target.buffedAttack = true;
                        events.push({
                            type: "doomer-buffed",
                            target: target.color
                        });
                        // Mark for double damage for the next attack (handled in game state)
                    }
                }
                break;

            case "defend": 
                if(action.target === actorColor) {
                    // Self-defense
                    const wasAttacked = Object.values(abilities).some(
                        a => a.abilities === "attack" && a.target === actorColor
                    );
                    const wasSabotaged = Object.values(abilities).some(
                        a => a.abilities === "sabotage" && a.target === actorColor
                    );

                    if(wasAttacked || wasSabotaged) {
                        changes.push({
                            color: actorColor,
                            auraChange: 1,
                            reason: "Successful self-defense"
                        });
                    } else {
                        changes.push({
                            color: actorColor,
                            auraChange: -0.5,
                            reason: "Unnecessary self-defense"
                        });
                    }
                }
                break;

            case "sabotage":
            case "invisibleSabotage": 
                changes.push({
                    color: target.color,
                    auraChange: -1,
                    reason: "Sabotaged"
                });
                changes.push({
                    color: actorColor,
                    auraChange: 1,
                    reason: "Successful sabotage"
                });

                const isVisible = action.ability === "sabotage" || !invisibleSabotage;
                if(isVisible) {
                    events.push({
                        type: "sabotage-visible",
                        saboteur: actorColor,
                        target: target.color
                    });
                }
                break;
        }
    });

    return { changes, events };
}

function resolveVotes(game) {
    const changes = [];
    const events = [];
    const votes = game.votes || {};
    const doubleVote = game.currentEvent?.modifier === "double-vote";

    // Count votes 
    const voteCounts = {};
    Object.values(votes).forEach(target => {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
    });

    // Find player(s) with the most votes
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const eliminated = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes && count > 0)
        .map(([color]) => color);

    if(eliminated.length === 1) {
        // Someone is voted out
        changes.push({
            color: eliminated[0],
            eliminated: true,
            reason: "Voted out"
        });

        events.push({
            type: "voted-out",
            player: eliminated[0],
            votes: maxVotes
        });

        const auraChange = doubleVote ? 1 : 0.5;

        // All voters get Aura changes
        Object.entries(votes).forEach(([voterColor, target]) => {
            if(target === eliminated[0]) {
                changes.push({
                    color: voterColor,
                    auraChange: auraChange,
                    reason: "Voted correctly"
                });
            } else {
                changes.push({
                    color: voterColor,
                    auraChange: -auraChange,
                    reason: "Voted incorrectly"
                });
            }
        });
    }

    return { changes, events };
}

// Helper function to resolve collab voting
export function resolveCollabVoting(game) {
    const proposals = game.collabProposals || [];

    if(proposals.length === 0) {
        return { winningCollab: null, auraChanges: [] };
    }

    // Find proposal with most votes
    let maxVotes = 0;
    let winners = [];

    proposals.forEach(proposal => {
        const voteCount = proposal.votes.length;
        if(voteCount > maxVotes) {
            maxVotes = voteCount;
            winners = [proposal];
        } else if(voteCount === maxVotes) {
            winners.push(proposal);
        }
    });

    const auraChanges = [];

    // Handle tie; all tied collabs get +1 Aura
    if(winners.length > 1) {
        winners.forEach(collab => {
            collab.votes.forEach(voterColor => {
                const player = game.players.find(p => p.color === voterColor);
                auraChanges.push({
                    playerId: player.id,
                    playerColor: voterColor,
                    change: 1,
                    reason: "Tied collab vote",
                });
            });
        });
        return { winningCollab: null, auraChanges, tie: true };
    }

    // Single winner
    const winningCollab = winners[0];

    // Winner proposer gets +2 Aura
    const proposer = game.players.find(p => p.color === winningCollab.proposer);
    auraChanges.push({
        playerId: proposer.id,
        playerColor: proposer.color,
        change: 2,
        reason: "Won collab proposal",
    });

    // Members get +1 Aura
    winningCollab.votes.forEach(voterColor => {
        const player = game.players.find(p => p.color === voterColor);
        auraChanges.push({
            playerId: player.id,
            playerColor: voterColor,
            change: 1,
            reason: "Voted for winning collab",
        });
    });

    // Loser proposer gets -2 Aura
    proposals.forEach(proposal => {
        if(proposal.id === winningCollab.id) return;
        const losingProposer = proposal.proposer;
        auraChanges.push({
            playerId: losingProposer.id,
            playerColor: losingProposer.color,
            change: -2,
            reason: "Lose collab proposal",
        });
    });

    // Losers get -1 Aura
    proposals.forEach(proposal => {
        if(proposal.id === winningCollab.id) return;
        proposal.votes.forEach(voterColor => {
            const player = game.players.find(p => p.color === voterColor);
            auraChanges.push({
                playerId: player.id,
                playerColor: voterColor,
                change: -1,
                reason: "Voted for losing collab"
            });
        });
    });

    return { winningCollab, auraChanges };
}

// Helper function to check win condition
export function checkWinConditions(game) {
    const alivePlayers = game.players.filter(p => p.alive);
    const winners = [];

    // Check if any doomers have 10+ Aura
    const winningDoomer = alivePlayers.find(p => p.role === "doomer" && p.aura >= 10);
    if(winningDoomer) {
        return [{ id: winningDoomer.id, color: winningDoomer.color, role: "doomer", type: "overlord" }];
    }

    // Check if two vibers have 10+ Aura
    const winningVibers = alivePlayers.filter(p => p.role === "viber" && p.aura >= 10);
    if(winningVibers.length >= 2) {
        return winningVibers.map(v => ({ id: v.id, color: v.color, role: "viber", type: "overlord" }));
    }

    // End game with two players remaining
    if(alivePlayers.length === 2) {
        const roles = alivePlayers.map(p => p.role);
        const hasViber = roles.includes("viber");
        const hasDoomer = roles.includes("doomer");
        const allVibers = roles.every(r => r === "viber");
        const allDoomers = roles.every(r => r === "doomer");

        // Check if any viber already won (has 10+ Aura)
        const viberWinner = alivePlayers.find(p => p.role === "viber" && p.aura >= 10);

        if(viberWinner) {
            // One viber has won (Aura >= 10)
            if(allVibers) {
                // Both vibers - highest Aura wins
                const sorted = alivePlayers.sort((a, b) => b.aura - a.aura);
                if(sorted[0].aura === sorted[1].aura) {
                    // Tie - all 3 winners (the one who hits 10+ first and these two)
                    return alivePlayers.map(p => ({
                        id: p.id,
                        color: p.color,
                        role: p.role,
                        type: "tie"
                    }));
                }
                return [{
                    id: sorted[0].id,
                    color: sorted[0].color,
                    role: sorted[0].role,
                    type: "highest-aura"
                }];
            } else if(allDoomers) {
                // Both doomers - doomers win, previous viber winner is stripped
                return alivePlayers.map(p => ({
                    id: p.id,
                    color: p.color,
                    role: p.role,
                    type: "doomer-takeover"
                }));
            } else {
                // 1 doomer + 1 viber - viber wins
                return [{
                    id: viberWinner.id,
                    color: viberWinner.color,
                    role: viberWinner.role,
                    type: "viber-survives"
                }];
            }
        } else {
            // No viber has won yet (Aura < 10 for all)
            if(allVibers) {
                // Both vibers - both win
                return alivePlayers.map(p => ({
                    id: p.id,
                    color: p.color,
                    role: p.role,
                    type: "final-vibers"
                }));
            } else if(allDoomers) {
                // Both doomers - both win
                return alivePlayers.map(p => ({
                    id: p.id,
                    color: p.color,
                    role: p.role,
                    type: "final-doomers"
                }));
            } else {
                // 1 doomer + 1 viber - doomer wins
                const doomer = alivePlayers.find(p => p.role === "doomer");
                return [{
                    id: doomer.id,
                    color: doomer.color,
                    role: doomer.role,
                    type: "doomer-eliminates-last-viber"
                }];
            }
        }
    }

    // Game continues; no winner yet
    return [];
}