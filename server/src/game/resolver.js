// Fixed resolver.js with proper elimination and vote logic

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
  if (game.currentEvent) {
    const eventChanges = applyEventEffect(game);
    if (eventChanges.changes) {
      changes.push(...eventChanges.changes);
    }
    if (eventChanges.reveal) {
      events.push({
        type: "event-reveal",
        data: eventChanges.reveal,
      });
    }
  }

  // 4. Check for elimination based on Aura and Vibe
  game.players.forEach((player) => {
    // Skip if already eliminated this round
    const alreadyEliminated = changes.some(
      (c) => c.color === player.color && c.eliminated,
    );
    if (alreadyEliminated) return;

    // Calculate total aura change
    const totalAuraChange = changes
      .filter((c) => c.color === player.color && c.auraChange)
      .reduce((sum, c) => sum + c.auraChange, 0);

    // Calculate total vibe change
    const totalVibeChange = changes
      .filter((c) => c.color === player.color && c.vibeChange)
      .reduce((sum, c) => sum + c.vibeChange, 0);

    const newAura = player.aura + totalAuraChange;
    const newVibe = player.vibe + totalVibeChange;

    // Check Aura elimination (≤ -5)
    if (newAura <= -5) {
      changes.push({
        color: player.color,
        eliminated: true,
        reason: "Aura dropped to -5 or below",
      });
      events.push({
        type: "elimination",
        player: player.color,
        reason: "Low Aura",
      });
    }
    // Check Vibe elimination (≤ 0)
    else if (newVibe <= 0) {
      changes.push({
        color: player.color,
        eliminated: true,
        reason: "Vibe dropped to 0",
      });
      events.push({
        type: "elimination",
        player: player.color,
        reason: "No Vibe remaining",
      });
    }
  });

  return { changes, events };
};

function applyEventEffect(game) {
  const event = game.currentEvent;

  if (event && event.effect) {
    const result = event.effect(game);

    // Handle different return formats from event effects
    if (result) {
      const changes = Array.isArray(result.changes)
        ? result.changes
        : Array.isArray(result)
          ? result
          : [];

      return {
        changes: changes,
        reveal: result.reveal,
      };
    }
  }

  return { changes: [] };
}

function resolveAbilities(game) {
  const changes = [];
  const events = [];
  const abilities = game.abilities || {};
  const collabHost = game.collabHost;
  const currentEvent = game.currentEvent;

  // Check event modifiers
  const healingBoost = currentEvent?.modifier === "healing-boost";
  const invisibleSabotage = currentEvent?.modifier === "invisible-sabotage";
  const firstAttackImmune = currentEvent?.modifier === "first-attack-immune";
  const revealAttacks = currentEvent?.modifier === "reveal-attacks";

  let firstAttackUsed = false;

  Object.entries(abilities).forEach(([actorColor, action]) => {
    const actor = game.players.find((p) => p.color === actorColor);
    const target = game.players.find((p) => p.color === action.target);

    if (!actor || !target) return;

    switch (action.ability) {
      case "attack":
        // Check if target is defended
        const defender = Object.entries(abilities).find(
          ([color, a]) => a.ability === "defend" && a.target === target.color,
        );

        const isImmune = firstAttackImmune && !firstAttackUsed;
        if (isImmune) firstAttackUsed = true;

        if (defender || target.color === collabHost || isImmune) {
          // Attack blocked
          events.push({
            type: "attack-blocked",
            attacker: actorColor,
            target: target.color,
            defender: defender
              ? defender[0]
              : isImmune
                ? "event"
                : "collab-host",
            visible: revealAttacks,
          });

          if (defender) {
            changes.push({
              color: defender[0],
              auraChange: 1,
              reason: "Defended against attack",
            });
          }
        } else {
          const damageMultiplier = target.buffedAttack ? 2 : 1;
          // Attack succeeds
          changes.push({
            color: target.color,
            vibeChange: -1 * damageMultiplier,
            auraChange: -1 * damageMultiplier,
            reason: "attacked",
          });

          if (target.buffedAttack) {
            target.buffedAttack = false;
          }

          events.push({
            type: "attack",
            attacker: actorColor,
            target: target.color,
            damage: damageMultiplier,
            visible: revealAttacks,
          });
        }
        break;

      case "heal":
        const needsHealing = target.vibe < 2;

        if (needsHealing || healingBoost) {
          changes.push({
            color: actorColor,
            auraChange: 1,
            reason: healingBoost ? "Heal (event boost)" : "Successful heal",
          });
          changes.push({
            color: target.color,
            vibeChange: Math.min(1, 2 - target.vibe),
            reason: "Healed",
          });
        } else {
          // Wrong heal
          changes.push({
            color: actorColor,
            auraChange: -1,
            reason: "Wrong heal",
          });
          changes.push({
            color: target.color,
            auraChange: 1,
            reason: "Healed while full HP",
          });

          if (target.role === "doomer") {
            target.buffedAttack = true;
            events.push({
              type: "doomer-buffed",
              target: target.color,
            });
          }
        }
        break;

      case "defend":
        if (action.target === actorColor) {
          // Self-defense
          const wasAttacked = Object.values(abilities).some(
            (a) => a.ability === "attack" && a.target === actorColor,
          );
          const wasSabotaged = Object.values(abilities).some(
            (a) => a.ability === "sabotage" && a.target === actorColor,
          );

          if (wasAttacked || wasSabotaged) {
            changes.push({
              color: actorColor,
              auraChange: 1,
              reason: "Successful self-defense",
            });
          } else {
            changes.push({
              color: actorColor,
              auraChange: -0.5,
              reason: "Unnecessary self-defense",
            });
          }
        }
        break;

      case "sabotage":
      case "invisibleSabotage":
        changes.push({
          color: target.color,
          auraChange: -1,
          reason: "Sabotaged",
        });
        changes.push({
          color: actorColor,
          auraChange: 1,
          reason: "Successful sabotage",
        });

        const isVisible = action.ability === "sabotage" || !invisibleSabotage;
        if (isVisible) {
          events.push({
            type: "sabotage-visible",
            saboteur: actorColor,
            target: target.color,
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

  // Count ALL votes (including "skip")
  const voteCounts = {};
  Object.entries(votes).forEach(([voter, target]) => {
    voteCounts[target] = (voteCounts[target] || 0) + 1;
  });

  // Find the max vote count
  const maxVotes = Math.max(...Object.values(voteCounts), 0);

  // No votes at all
  if (maxVotes === 0) {
    events.push({
      type: "no-elimination",
      reason: "No votes cast",
    });
    return { changes, events };
  }

  // Find all options with max votes
  const topVoted = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([target]) => target);

  // If skip is among the winners (either alone or tied), no elimination
  if (topVoted.includes("skip")) {
    events.push({
      type: "no-elimination",
      reason:
        topVoted.length === 1
          ? "Skip votes won"
          : "Skip votes tied for most votes",
    });
    return { changes, events };
  }

  // Skip didn't win - handle player elimination
  if (topVoted.length === 1) {
    // Someone is voted out
    const eliminatedPlayer = topVoted[0];
    changes.push({
      color: eliminatedPlayer,
      eliminated: true,
      reason: "Voted out",
    });

    events.push({
      type: "voted-out",
      player: eliminatedPlayer,
      votes: maxVotes,
    });

    const auraChange = doubleVote ? 1 : 0.5;

    // All voters get Aura changes (skip voters don't get aura changes)
    Object.entries(votes).forEach(([voterColor, target]) => {
      if (target === "skip") return;

      if (target === eliminatedPlayer) {
        changes.push({
          color: voterColor,
          auraChange: auraChange,
          reason: "Voted correctly",
        });
      } else {
        changes.push({
          color: voterColor,
          auraChange: -auraChange,
          reason: "Voted incorrectly",
        });
      }
    });
  } else {
    // Tie between players (skip not involved) - no one is eliminated
    events.push({
      type: "vote-tie",
      tiedPlayers: topVoted,
      votes: maxVotes,
    });
  }

  return { changes, events };
}

// Helper function to resolve collab voting
export function resolveCollabVoting(game) {
  const proposals = game.collabProposals || [];
  const skipVotes = game.skipVotes || [];

  if (proposals.length === 0 && skipVotes.length === 0) {
    return { winningCollab: null, auraChanges: [] };
  }

  // Count skip votes
  const skipVoteCount = skipVotes.length;

  // Find proposal with most votes
  let maxVotes = skipVoteCount;
  let winners = [];
  let skipIsWinner = skipVoteCount > 0;

  proposals.forEach((proposal) => {
    const voteCount = proposal.votes.length;
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winners = [proposal];
      skipIsWinner = false;
    } else if (voteCount === maxVotes) {
      if (!skipIsWinner) {
        winners.push(proposal);
      }
      // If skip has max votes, it's also a winner (tied)
      if (voteCount === skipVoteCount && skipVoteCount > 0) {
        skipIsWinner = true;
      }
    }
  });

  const auraChanges = [];

  // If skip wins or ties, penalize all proposals and their voters
  if (skipIsWinner) {
    // All proposers get -2 Aura
    proposals.forEach((proposal) => {
      const proposerPlayer = game.players.find(
        (p) => p.color === proposal.proposer,
      );
      if (proposerPlayer) {
        auraChanges.push({
          playerId: proposerPlayer.id,
          playerColor: proposerPlayer.color,
          change: -2,
          reason: "Collab proposal rejected by skip",
        });
      }
    });

    // All voters for proposals get -1 Aura
    proposals.forEach((proposal) => {
      proposal.votes.forEach((voterColor) => {
        const player = game.players.find((p) => p.color === voterColor);
        if (player) {
          auraChanges.push({
            playerId: player.id,
            playerColor: voterColor,
            change: -1,
            reason: "Voted for rejected collab",
          });
        }
      });
    });

    return {
      winningCollab: null,
      auraChanges,
      skipped: true,
      reason:
        skipVoteCount > 0 && winners.length === 0
          ? "Skip votes won"
          : "Skip votes tied for most votes",
    };
  }

  // Handle tie between proposals (skip not involved)
  if (winners.length > 1) {
    winners.forEach((collab) => {
      collab.votes.forEach((voterColor) => {
        const player = game.players.find((p) => p.color === voterColor);
        if (player) {
          auraChanges.push({
            playerId: player.id,
            playerColor: voterColor,
            change: 1,
            reason: "Tied collab vote",
          });
        }
      });
    });
    return { winningCollab: null, auraChanges, tie: true };
  }

  // Single winner
  const winningCollab = winners[0];

  // Winner proposer gets +2 Aura
  const proposer = game.players.find((p) => p.color === winningCollab.proposer);
  auraChanges.push({
    playerId: proposer.id,
    playerColor: proposer.color,
    change: 2,
    reason: "Won collab proposal",
  });

  // Members get +1 Aura
  winningCollab.votes.forEach((voterColor) => {
    const player = game.players.find((p) => p.color === voterColor);
    if (player) {
      auraChanges.push({
        playerId: player.id,
        playerColor: voterColor,
        change: 1,
        reason: "Voted for winning collab",
      });
    }
  });

  // Loser proposer gets -2 Aura
  proposals.forEach((proposal) => {
    if (proposal.id === winningCollab.id) return;
    const losingProposerPlayer = game.players.find(
      (p) => p.color === proposal.proposer,
    );
    if (losingProposerPlayer) {
      auraChanges.push({
        playerId: losingProposerPlayer.id,
        playerColor: losingProposerPlayer.color,
        change: -2,
        reason: "Lose collab proposal",
      });
    }
  });

  // Losers get -1 Aura
  proposals.forEach((proposal) => {
    if (proposal.id === winningCollab.id) return;
    proposal.votes.forEach((voterColor) => {
      const player = game.players.find((p) => p.color === voterColor);
      if (player) {
        auraChanges.push({
          playerId: player.id,
          playerColor: voterColor,
          change: -1,
          reason: "Voted for losing collab",
        });
      }
    });
  });

  return { winningCollab, auraChanges };
}

// Helper function to check win condition
export function checkWinConditions(game) {
  const alivePlayers = game.players.filter((p) => p.alive);
  const winners = [];

  // Check if any doomers have 10+ Aura
  const winningDoomer = alivePlayers.find(
    (p) => p.role === "doomer" && p.aura >= 10,
  );
  if (winningDoomer) {
    return [
      {
        id: winningDoomer.id,
        color: winningDoomer.color,
        role: "doomer",
        type: "overlord",
      },
    ];
  }

  // Check if two vibers have 10+ Aura
  const winningVibers = alivePlayers.filter(
    (p) => p.role === "viber" && p.aura >= 10,
  );
  if (winningVibers.length >= 2) {
    return winningVibers.map((v) => ({
      id: v.id,
      color: v.color,
      role: "viber",
      type: "overlord",
    }));
  }

  // Check if all remaining alive players are doomers (all vibers eliminated)
  const allDoomersAlive =
    alivePlayers.length > 0 && alivePlayers.every((p) => p.role === "doomer");
  if (allDoomersAlive) {
    return alivePlayers.map((p) => ({
      id: p.id,
      color: p.color,
      role: p.role,
      type: "all-vibers-eliminated",
    }));
  }

  // Check if all remaining alive players are vibers (all doomers eliminated)
  const allVibersAlive =
    alivePlayers.length > 0 && alivePlayers.every((p) => p.role === "viber");
  if (allVibersAlive) {
    return alivePlayers.map((p) => ({
      id: p.id,
      color: p.color,
      role: p.role,
      type: "all-doomers-eliminated",
    }));
  }

  // End game with two players remaining
  if (alivePlayers.length === 2) {
    const roles = alivePlayers.map((p) => p.role);
    const hasViber = roles.includes("viber");
    const hasDoomer = roles.includes("doomer");
    const allVibers = roles.every((r) => r === "viber");
    const allDoomers = roles.every((r) => r === "doomer");

    // Check if any viber already won (has 10+ Aura)
    const viberWinner = alivePlayers.find(
      (p) => p.role === "viber" && p.aura >= 10,
    );

    if (viberWinner) {
      // One viber has won (Aura >= 10)
      if (allVibers) {
        // Both vibers - highest Aura wins
        const sorted = alivePlayers.sort((a, b) => b.aura - a.aura);
        if (sorted[0].aura === sorted[1].aura) {
          // Tie - all 3 winners (the one who hits 10+ first and these two)
          return alivePlayers.map((p) => ({
            id: p.id,
            color: p.color,
            role: p.role,
            type: "tie",
          }));
        }
        return [
          {
            id: sorted[0].id,
            color: sorted[0].color,
            role: sorted[0].role,
            type: "highest-aura",
          },
        ];
      } else if (allDoomers) {
        // Both doomers - doomers win, previous viber winner is stripped
        return alivePlayers.map((p) => ({
          id: p.id,
          color: p.color,
          role: p.role,
          type: "doomer-takeover",
        }));
      } else {
        // 1 doomer + 1 viber - viber wins
        return [
          {
            id: viberWinner.id,
            color: viberWinner.color,
            role: viberWinner.role,
            type: "viber-survives",
          },
        ];
      }
    } else {
      // No viber has won yet (Aura < 10 for all)
      if (allVibers) {
        // Both vibers - both win
        return alivePlayers.map((p) => ({
          id: p.id,
          color: p.color,
          role: p.role,
          type: "final-vibers",
        }));
      } else if (allDoomers) {
        // Both doomers - both win
        return alivePlayers.map((p) => ({
          id: p.id,
          color: p.color,
          role: p.role,
          type: "final-doomers",
        }));
      } else {
        // 1 doomer + 1 viber - doomer wins
        const doomer = alivePlayers.find((p) => p.role === "doomer");
        return [
          {
            id: doomer.id,
            color: doomer.color,
            role: doomer.role,
            type: "doomer-eliminates-last-viber",
          },
        ];
      }
    }
  }

  // Game continues; no winner yet
  return [];
}
