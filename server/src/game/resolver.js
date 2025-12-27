export const resolveRound = (game) => {
    const changes = [];
    const events = [];

    // 1. Resolve abilities (attacks, heals, defends, sabotages)
    const abilityResults = resolveAbilities(game);
    changes.push(...abilityResults.changes);
    events.push(...abilityResults.evnets);

    // 2. Resolve votes
    const voteResults = resolveVotes(game);
    changes.push(...voteResults.changes);
    events.push(...voteResults.events);

    // 3. Check for elimination
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

function resolveAbilities(game) {
    const changes = [];
    const events = [];
    const abilities = game.abilites || {};
    const collabHost = game.collabHost;

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

                if(defender || target.color === collabHost) {
                    // Attack blocked
                    events.push({
                        type: "attack-blocked",
                        attacker: actorColor,
                        target: target.color,
                        defender: defender ? defender[0] : "collab-host"
                    });
                    
                    if(defender) {
                        changes.push({
                            color: defender[0],
                            auraChange: 1,
                            reason: "Defended against attack"
                        });
                    }
                } else {
                    // Attack succeeds
                    changes.push({
                        color: target.color,
                        vibeChange: -1,
                        auraChange: -1,
                        reason: "attacked"
                    });

                    events.push({
                        type: "attack",
                        attacker: actorColor,
                        target: target.color
                    });
                }
                break;
            
            case "heal": 
                const needsHealing = target.vibe < 2;

                if(needsHealing) {
                    changes.push({
                        color: actorColor,
                        auraChange: 1,
                        reason: "Successful heal"
                    });
                    changes.push({
                        color: target.color,
                        vibeChange: 1,
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

                if(action.ability === "sabotage") {
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

        // All voters get Aura changes
        Object.entries(votes).forEach(([voterColor, target]) => {
            if(target === eliminated[0]) {
                changes.push({
                    color: voterColor,
                    auraChange: 0.5,
                    reason: "Voted correctly"
                });
            } else {
                changes.push({
                    color: voterColor,
                    auraChange: -0.5,
                    reason: "Voted incorrectly"
                });
            }
        });
    }

    return { changes, events };
}