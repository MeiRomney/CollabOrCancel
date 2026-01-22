import BotAI, { assignBotPersonality } from "./botPersonalities.js";
import { getGame, updateGame } from "../game/gameManager.js";

// Store active bot timers and intervals
const botTimers = new Map();
const botIntervals = new Map();

// Initialize bots with personalities when game starts
export function initializeBots(game) {
  game.players.forEach((player) => {
    if (player.isBot) {
      Object.assign(player, assignBotPersonality(player));
    }
  });
}

// Clear all bot timers and intervals for a game
export function clearBotTimers(gameId) {
  const timers = botTimers.get(gameId) || [];
  timers.forEach((timer) => clearTimeout(timer));
  botTimers.delete(gameId);

  const intervals = botIntervals.get(gameId) || [];
  intervals.forEach((interval) => clearInterval(interval));
  botIntervals.delete(gameId);
}

// Add timer to tracking
function addTimer(gameId, timer) {
  if (!botTimers.has(gameId)) {
    botTimers.set(gameId, []);
  }
  botTimers.get(gameId).push(timer);
}

// Add interval to tracking
function addInterval(gameId, interval) {
  if (!botIntervals.has(gameId)) {
    botIntervals.set(gameId, []);
  }
  botIntervals.get(gameId).push(interval);
}

// Generate context based on current game phase
function getPhaseContext(phase) {
  const contexts = {
    COLLAB_PROPOSAL: [
      "Thinking about who to trust...",
      "Should we form alliances?",
      "Looking at the current situation...",
      "Analyzing the proposals...",
    ],
    COLLAB_VOTING: [
      "Time to vote on these collabs",
      "Which proposal looks best?",
      "Need to choose wisely here",
      "Let me analyze these options...",
    ],
    DM_PHASE: [
      "Time for some private conversations",
      "What's everyone planning?",
      "This phase is crucial...",
      "Need to gather information",
    ],
    ACTION_PHASE: [
      "Decision time is approaching",
      "Who looks most suspicious?",
      "Need to think carefully about this vote",
      "The votes are piling up...",
    ],
  };

  const phaseContexts = contexts[phase] || ["What's happening?"];
  return phaseContexts[Math.floor(Math.random() * phaseContexts.length)];
}

// CONTINUOUS PUBLIC CHAT - Bots chat randomly throughout each phase
export function startContinuousBotChat(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  console.log(`🔄 Starting continuous chat for game ${gameId}`);

  // Create an interval that triggers bot messages
  const chatInterval = setInterval(async () => {
    const currentGame = getGame(gameId);
    if (!currentGame || currentGame.phase === "GAME_OVER") {
      clearInterval(chatInterval);
      return;
    }

    const bots = currentGame.players.filter(
      (p) => p.isBot && p.alive && !p.eliminated,
    );

    // Each bot has a chance to chat
    for (const bot of bots) {
      // Random chance to chat (30% per interval)
      if (Math.random() < 0.3) {
        try {
          const { generateBotChatMessage } = await import("./botAIChat.js");

          // Generate context based on current phase
          const context = getPhaseContext(currentGame.phase);

          const message = await generateBotChatMessage(
            bot,
            currentGame,
            context,
          );

          io.to(gameId).emit("message-received", {
            message,
            senderColor: bot.color,
            timestamp: Date.now(),
          });

          console.log(`💬 Bot ${bot.name}: ${message}`);
        } catch (error) {
          console.error("Bot chat error:", error);
        }
      }
    }
  }, 8000); // Check every 8 seconds

  addInterval(gameId, chatInterval);
  console.log(`✅ Continuous chat started for game ${gameId}`);
}

// CONTINUOUS DM INTERACTIONS - Bots send DMs throughout DM phase
export function startContinuousBotDMs(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  console.log(`💌 Starting continuous DMs for game ${gameId}`);

  const dmInterval = setInterval(async () => {
    const currentGame = getGame(gameId);
    if (!currentGame || currentGame.phase !== "DM_PHASE") {
      clearInterval(dmInterval);
      return;
    }

    const bots = currentGame.players.filter(
      (p) => p.isBot && p.alive && !p.eliminated,
    );

    for (const bot of bots) {
      // Check if bot has any active DM conversations
      const activeDMs =
        currentGame.dms?.filter(
          (dm) =>
            dm.participants?.includes(bot.color) && dm.status === "active",
        ) || [];

      // Send messages in existing DMs
      if (activeDMs.length > 0 && Math.random() < 0.4) {
        const dm = activeDMs[Math.floor(Math.random() * activeDMs.length)];
        const recipient = dm.participants.find((p) => p !== bot.color);

        try {
          const { generateBotDMMessage } = await import("./botAIChat.js");
          const message = await generateBotDMMessage(
            bot,
            currentGame,
            recipient,
            dm.messages || [],
          );

          // Emit DM message
          io.to(gameId).emit("dm-message-received", {
            room: dm.room,
            message,
            senderColor: bot.color,
            timestamp: Date.now(),
          });

          console.log(`📨 Bot ${bot.name} -> DM: ${message}`);
        } catch (error) {
          console.error("Bot DM error:", error);
        }
      }

      // Initiate new DMs occasionally
      if (Math.random() < 0.15 && activeDMs.length < 2) {
        const alivePlayers = currentGame.players.filter(
          (p) => p.alive && p.id !== bot.id,
        );

        if (alivePlayers.length > 0) {
          const target =
            alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

          io.to(gameId).emit("dm-requested", {
            from: bot.color,
            to: target.color,
          });

          console.log(`📨 Bot ${bot.name} requested DM with ${target.name}`);
        }
      }
    }
  }, 10000); // Check every 10 seconds

  addInterval(gameId, dmInterval);
  console.log(`✅ Continuous DMs started for game ${gameId}`);
}

// CONTINUOUS VOTING - Bots can change votes multiple times
export function startContinuousBotVoting(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  console.log(`🗳️ Starting continuous voting for game ${gameId}`);

  const votingInterval = setInterval(async () => {
    const currentGame = getGame(gameId);
    if (!currentGame || currentGame.phase !== "ACTION_PHASE") {
      clearInterval(votingInterval);
      return;
    }

    const bots = currentGame.players.filter(
      (p) => p.isBot && p.alive && !p.eliminated,
    );

    for (const bot of bots) {
      // 25% chance to change vote each interval
      if (Math.random() < 0.25) {
        const ai = new BotAI(bot, currentGame);
        const alivePlayers = currentGame.players.filter(
          (p) => p.alive && p.id !== bot.id,
        );
        const targets = alivePlayers.map((p) => p.color);

        let target;

        // Try AI-powered decision
        try {
          const { analyzeBotVoting } = await import("./botAIChat.js");
          const aiDecision = await analyzeBotVoting(bot, currentGame, targets);
          if (aiDecision) {
            target = aiDecision.target;
            console.log(
              `🤖 AI Decision: ${bot.name} -> ${target} (${aiDecision.reasoning})`,
            );
          }
        } catch (error) {
          console.log("Using fallback voting logic");
        }

        // Fallback to regular AI logic
        if (!target) {
          target = ai.chooseVoteTarget();
        }

        if (target) {
          updateGame(gameId, (g) => {
            if (!g.votes) g.votes = {};
            g.votes[bot.color] = target;
          });

          const updatedGame = getGame(gameId);
          io.to(gameId).emit("vote-updated", {
            votes: updatedGame.votes || {},
          });

          console.log(`🤖 Bot ${bot.name} voted for: ${target}`);
        }
      }
    }
  }, 7000); // Check every 7 seconds

  addInterval(gameId, votingInterval);
  console.log(`✅ Continuous voting started for game ${gameId}`);
}

// Bot actions during COLLAB_PROPOSAL phase
export function handleBotCollabProposals(io, gameId) {
  const game = getGame(gameId);
  if (!game) {
    console.log(`❌ No game found for ${gameId}`);
    return;
  }

  const bots = game.players.filter((p) => p.isBot && p.alive && !p.eliminated);
  console.log(
    `🤖 [COLLAB_PROPOSAL] Found ${bots.length} eligible bots for game ${gameId}`,
  );
  console.log(
    `   Bots: ${bots.map((b) => `${b.name} (${b.personality})`).join(", ")}`,
  );

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);
    let attemptCount = 0;
    const maxAttempts = 4;

    // Give each bot multiple chances to propose during the phase
    const checkProposal = () => {
      const currentGame = getGame(gameId);
      if (!currentGame) {
        console.log(`❌ Game ${gameId} no longer exists`);
        return;
      }

      if (currentGame.phase !== "COLLAB_PROPOSAL") {
        console.log(
          `⏭️  Bot ${bot.name}: Phase changed to ${currentGame.phase}, stopping collab checks`,
        );
        return;
      }

      const currentBot = currentGame.players.find((p) => p.color === bot.color);
      if (!currentBot || !currentBot.alive || currentBot.eliminated) {
        console.log(
          `❌ Bot ${bot.name} is no longer eligible (alive: ${currentBot?.alive}, eliminated: ${currentBot?.eliminated})`,
        );
        return;
      }

      attemptCount++;

      // Create new AI instance with current game state
      const currentAI = new BotAI(currentBot, currentGame);
      const shouldPropose = currentAI.shouldProposeCollab();

      console.log(
        `🎲 Bot ${bot.name} (${bot.personality}) attempt ${attemptCount}/${maxAttempts}:`,
      );
      console.log(`   - Aura: ${currentBot.aura}, Vibe: ${currentBot.vibe}`);
      console.log(
        `   - Base chance: ${currentAI.personality.collabProposalChance}`,
      );
      console.log(`   - shouldPropose: ${shouldPropose}`);

      if (shouldPropose) {
        const hasExisting = currentGame.collabProposals?.find(
          (p) => p.proposer === bot.color,
        );

        if (hasExisting) {
          console.log(`⚠️  Bot ${bot.name} already has a proposal, skipping`);
          return;
        }

        updateGame(gameId, (g) => {
          if (!g.collabProposals) g.collabProposals = [];

          g.collabProposals.push({
            id: `collab-${Date.now()}-${bot.color}`,
            proposer: bot.color,
            votes: [],
            createdAt: Date.now(),
          });
        });

        const updatedGame = getGame(gameId);
        io.to(gameId).emit("collab-proposed", {
          proposals: updatedGame.collabProposals,
          skipVotes: updatedGame.skipVotes || [],
        });

        console.log(
          `✅ Bot ${bot.name} (${bot.personality}) PROPOSED a collab!`,
        );
      } else {
        // If bot didn't propose this time, check again later (unless max attempts reached)
        if (attemptCount < maxAttempts) {
          const recheckDelay = 3000 + Math.random() * 4000; // 3-7 seconds
          console.log(
            `⏰ Bot ${bot.name} will recheck in ${Math.round(recheckDelay / 1000)}s`,
          );
          const recheckTimer = setTimeout(checkProposal, recheckDelay);
          addTimer(gameId, recheckTimer);
        } else {
          console.log(
            `🛑 Bot ${bot.name} reached max attempts (${maxAttempts}), giving up`,
          );
        }
      }
    };

    // Initial delay before first check
    const initialDelay = ai.getDecisionDelay();
    console.log(
      `⏰ Bot ${bot.name} will check collab proposal in ${Math.round(initialDelay / 1000)}s`,
    );
    const timer = setTimeout(checkProposal, initialDelay);
    addTimer(gameId, timer);
  });
}

// Bot actions during COLLAB_VOTING phase
export function handleBotCollabVoting(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive && !p.eliminated);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);
    const delay = ai.getDecisionDelay() + 2000; // Extra delay after proposals

    const timer = setTimeout(() => {
      const updatedGame = getGame(gameId);
      if (!updatedGame || !updatedGame.collabProposals) return;

      const voteChoice = ai.chooseCollabVote(updatedGame.collabProposals);

      updateGame(gameId, (g) => {
        if (!g.collabProposals) g.collabProposals = [];
        if (!g.skipVotes) g.skipVotes = [];

        if (voteChoice === "skip") {
          // Remove any existing votes
          g.collabProposals.forEach((p) => {
            p.votes = p.votes.filter((v) => v !== bot.color);
          });

          // Add skip vote
          if (!g.skipVotes.includes(bot.color)) {
            g.skipVotes.push(bot.color);
          }
        } else {
          const proposal = g.collabProposals.find((p) => p.id === voteChoice);
          if (proposal) {
            // Remove all previous votes
            g.collabProposals.forEach((p) => {
              p.votes = p.votes.filter((v) => v !== bot.color);
            });
            g.skipVotes = g.skipVotes.filter((v) => v !== bot.color);

            // Add new vote
            if (!proposal.votes.includes(bot.color)) {
              proposal.votes.push(bot.color);
            }
          }
        }
      });

      const finalGame = getGame(gameId);
      io.to(gameId).emit("collab-vote-updated", {
        collabId: voteChoice,
        voterColor: bot.color,
        skipVotes: finalGame.skipVotes || [],
        proposals: finalGame.collabProposals,
      });

      console.log(`🤖 Bot ${bot.name} voted for: ${voteChoice}`);
    }, delay);

    addTimer(gameId, timer);
  });
}

// Get available abilities based on role (matching resolver.js)
function getAvailableAbilities(role) {
  if (role === "doomer") {
    const doomerAbilities = ["attack", "heal", "defend", "invisibleSabotage"];
    return doomerAbilities;
  }
  // All players have access to these abilities
  const commonAbilities = ["heal", "defend", "sabotage"];
  return commonAbilities;
}

// Get ability description for toast message
function getAbilityDescription(ability, actorName, targetName, isSelf) {
  const descriptions = {
    attack: {
      actor: `You attacked ${targetName}!`,
      target: `${actorName} attacked you!`,
    },
    heal: {
      actor: isSelf ? `You healed yourself!` : `You healed ${targetName}!`,
      target: `${actorName} healed you!`,
    },
    defend: {
      actor: isSelf ? `You defended yourself!` : `You defended ${targetName}!`,
      target: `${actorName} is defending you!`,
    },
    sabotage: {
      actor: `You sabotaged ${targetName}!`,
      target: `${actorName} sabotaged you!`,
    },
  };

  return (
    descriptions[ability] || {
      actor: `You used ${ability} on ${targetName}`,
      target: `${actorName} used ${ability} on you`,
    }
  );
}

// Bot actions during DM phase (abilities)
export function handleBotAbilities(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive && !p.eliminated);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);
    const delay = ai.getDecisionDelay();

    const timer = setTimeout(() => {
      // Get available abilities
      const abilities = getAvailableAbilities(bot.role);
      if (abilities.length === 0) return;

      // Choose ability based on AI logic
      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      const target = ai.chooseAbilityTarget(ability);

      if (target) {
        // Store ability in game state
        updateGame(gameId, (g) => {
          if (!g.abilities) g.abilities = {};
          g.abilities[bot.color] = { ability, target };
        });

        // Get player names for toast messages
        const targetPlayer = game.players.find((p) => p.color === target);
        const isSelf = target === bot.color;

        if (!targetPlayer) return;

        const descriptions = getAbilityDescription(
          ability,
          bot.name,
          targetPlayer.name,
          isSelf,
        );

        // Send toast to the bot (actor)
        io.to(gameId).emit("ability-used", {
          playerColor: bot.color,
          message: descriptions.actor,
          type: "success",
        });

        // Send toast to the target (if not self)
        if (!isSelf) {
          io.to(gameId).emit("ability-used", {
            playerColor: target,
            message: descriptions.target,
            type:
              ability === "attack" || ability === "sabotage"
                ? "warning"
                : "info",
          });
        }

        console.log(
          `🤖 Bot ${bot.name} used ${ability} on ${targetPlayer.name}`,
        );
      }
    }, delay);

    addTimer(gameId, timer);
  });
}

// Bot "typing" simulation during DM phase
export function simulateBotTyping(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive && !p.eliminated);

  bots.forEach((bot) => {
    // Random chance to show typing indicator
    if (Math.random() < 0.4) {
      const typingDuration = 2000 + Math.random() * 4000;

      setTimeout(() => {
        io.to(gameId).emit("player-typing", {
          playerColor: bot.color,
          isTyping: true,
        });

        setTimeout(() => {
          io.to(gameId).emit("player-typing", {
            playerColor: bot.color,
            isTyping: false,
          });
        }, typingDuration);
      }, Math.random() * 5000);
    }
  });
}

// Update bot memories after round resolution
export function updateBotMemories(game, resolutionResults) {
  const bots = game.players.filter((p) => p.isBot && p.alive && !p.eliminated);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);

    // Process events from resolution
    resolutionResults.changes.forEach((change) => {
      if (change.color === bot.color) {
        // Something happened to this bot
        if (change.votedBy && change.votedBy.length > 0) {
          change.votedBy.forEach((voter) => {
            ai.updateMemory({ type: "voted_for_me", voter });
          });
        }

        if (change.affectedBy) {
          ai.updateMemory({
            type: "ability_used_on_me",
            user: change.affectedBy,
          });
        }
      }

      if (change.eliminated) {
        ai.updateMemory({ type: "player_eliminated", player: change.color });
      }
    });

    // If bot was in a successful collab
    if (game.currentCollab) {
      const wasInCollab =
        game.currentCollab.proposer === bot.color ||
        game.currentCollab.votes.includes(bot.color);

      if (wasInCollab) {
        ai.updateMemory({
          type: "collab_success",
          partner: game.currentCollab.proposer,
        });
      }
    }
  });
}

// Main phase handler - called when phase changes
export function handleBotPhase(io, gameId, phase) {
  console.log(`🤖 Bot phase handler: ${phase} for game ${gameId}`);

  // Clear previous timers and intervals
  clearBotTimers(gameId);

  // START CONTINUOUS CHAT FOR ALL PHASES
  startContinuousBotChat(io, gameId);

  switch (phase) {
    case "COLLAB_PROPOSAL":
      // Bots decide whether to propose collabs
      setTimeout(() => {
        handleBotCollabProposals(io, gameId);
      }, 2000);
      break;

    case "COLLAB_VOTING":
      // Bots vote on collab proposals
      setTimeout(() => {
        handleBotCollabVoting(io, gameId);
      }, 2000);
      break;

    case "DM_PHASE":
      // Bots use abilities and start DM conversations
      setTimeout(() => {
        simulateBotTyping(io, gameId);
        startContinuousBotDMs(io, gameId);
      }, 3000);
      break;

    case "ACTION_PHASE":
      // Bots vote for elimination (can change votes multiple times)
      setTimeout(() => {
        handleBotAbilities(io, gameId);
        startContinuousBotVoting(io, gameId);
      }, 2000);
      break;
  }
}

export default {
  initializeBots,
  handleBotPhase,
  updateBotMemories,
  clearBotTimers,
};
