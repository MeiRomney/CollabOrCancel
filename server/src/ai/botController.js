// botController.js
// Controls bot actions during gameplay phases

import BotAI, { assignBotPersonality } from "./botPersonalities.js";
import { getGame, updateGame } from "../game/gameManager.js";

// Store active bot timers
const botTimers = new Map();

// Initialize bots with personalities when game starts
export function initializeBots(game) {
  game.players.forEach((player) => {
    if (player.isBot) {
      Object.assign(player, assignBotPersonality(player));
    }
  });
}

// Clear all bot timers for a game
export function clearBotTimers(gameId) {
  const timers = botTimers.get(gameId) || [];
  timers.forEach((timer) => clearTimeout(timer));
  botTimers.delete(gameId);
}

// Add timer to tracking
function addTimer(gameId, timer) {
  if (!botTimers.has(gameId)) {
    botTimers.set(gameId, []);
  }
  botTimers.get(gameId).push(timer);
}

// Bot actions during COLLAB_PROPOSAL phase
export function handleBotCollabProposals(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);
    const delay = ai.getDecisionDelay();

    const timer = setTimeout(() => {
      const shouldPropose = ai.shouldProposeCollab();

      if (shouldPropose) {
        updateGame(gameId, (g) => {
          if (!g.collabProposals) g.collabProposals = [];

          // Check if bot already proposed
          const existing = g.collabProposals.find(
            (p) => p.proposer === bot.color,
          );
          if (existing) return;

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
          `🤖 Bot ${bot.name} (${bot.personality}) proposed a collab`,
        );
      }
    }, delay);

    addTimer(gameId, timer);
  });
}

// Bot actions during collab voting
export function handleBotCollabVoting(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

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

// Bot actions during DM phase (abilities)
export function handleBotAbilities(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);
    const delay = ai.getDecisionDelay();

    const timer = setTimeout(() => {
      // Choose ability based on bot's role
      const abilities = getAvailableAbilities(bot.role);
      if (abilities.length === 0) return;

      const ability = abilities[Math.floor(Math.random() * abilities.length)];
      const target = ai.chooseAbilityTarget(ability);

      if (target) {
        updateGame(gameId, (g) => {
          if (!g.abilities) g.abilities = {};
          g.abilities[bot.color] = { ability, target };
        });

        console.log(`🤖 Bot ${bot.name} used ability: ${ability} on ${target}`);
      }
    }, delay);

    addTimer(gameId, timer);
  });
}

// Bot actions during voting phase - CAN VOTE ANYTIME
export function handleBotVoting(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

  bots.forEach((bot) => {
    const ai = new BotAI(bot, game);

    // Random chance to change vote during the phase
    const voteChanges = Math.floor(Math.random() * 3) + 1; // 1-3 vote changes

    for (let i = 0; i < voteChanges; i++) {
      const delay = ai.getDecisionDelay() * (i + 1) + Math.random() * 3000;

      const timer = setTimeout(async () => {
        const alivePlayers = game.players.filter(
          (p) => p.alive && p.id !== bot.id,
        );
        const targets = alivePlayers.map((p) => p.color);

        // Try AI-powered decision first
        let target;
        try {
          const { analyzeBotVoting } = await import("./botAIChat.js");
          const aiDecision = await analyzeBotVoting(bot, game, targets);
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

          console.log(
            `🤖 Bot ${bot.name} voted for: ${target} (change ${i + 1})`,
          );
        }
      }, delay);

      addTimer(gameId, timer);
    }
  });
}

// Bot "typing" simulation during DM phase
export function simulateBotTyping(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

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

// Get available abilities for a role
function getAvailableAbilities(role) {
  // This should match your game's role system
  const abilityMap = {
    VIBER: ["boost_vibe", "drain_vibe"],
    AURA_READER: ["read_aura", "sense_role"],
    PROTECTOR: ["protect", "shield"],
    SABOTEUR: ["sabotage", "weaken"],
    // Add more roles as needed
  };

  return abilityMap[role] || [];
}

// Update bot memories after round resolution
export function updateBotMemories(game, resolutionResults) {
  const bots = game.players.filter((p) => p.isBot && p.alive);

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

  // Clear previous timers
  clearBotTimers(gameId);

  switch (phase) {
    case "COLLAB_PROPOSAL":
      // Bots decide whether to propose collabs
      setTimeout(() => {
        handleBotCollabProposals(io, gameId);
        // Bots send chat messages about phase
        handleBotPublicChat(io, gameId, "Looking for collab partners!");
        // After some time, bots vote
        setTimeout(() => {
          handleBotCollabVoting(io, gameId);
        }, 8000);
      }, 2000);
      break;

    case "DM_PHASE":
      // Bots use abilities
      setTimeout(() => {
        handleBotAbilities(io, gameId);
        simulateBotTyping(io, gameId);
        handleBotPublicChat(io, gameId, "DM phase thoughts...");
        // Bots might initiate DMs
        handleBotDMInitiation(io, gameId);
      }, 3000);
      break;

    case "VOTING_PHASE":
      // Bots vote for elimination (can change votes multiple times)
      setTimeout(() => {
        handleBotVoting(io, gameId);
        handleBotPublicChat(io, gameId, "Time to vote...");
      }, 2000);
      break;
  }
}

// Bots send messages in public chat
export function handleBotPublicChat(io, gameId, context = "") {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

  // Random subset of bots chat (not all at once)
  const chattingBots = bots.filter(() => Math.random() < 0.6);

  chattingBots.forEach((bot, index) => {
    const delay = (index + 1) * (2000 + Math.random() * 3000);

    const timer = setTimeout(async () => {
      try {
        const { generateBotChatMessage } = await import("./botAIChat.js");
        const message = await generateBotChatMessage(bot, game, context);

        io.to(gameId).emit("message-received", {
          message,
          senderColor: bot.color,
          timestamp: Date.now(),
        });

        console.log(`💬 Bot ${bot.name}: ${message}`);
      } catch (error) {
        console.error("Bot chat error:", error);
      }
    }, delay);

    addTimer(gameId, timer);
  });
}

// Bots decide whether to initiate DMs
export function handleBotDMInitiation(io, gameId) {
  const game = getGame(gameId);
  if (!game) return;

  const bots = game.players.filter((p) => p.isBot && p.alive);

  bots.forEach((bot) => {
    // Each bot has a chance to initiate a DM
    if (Math.random() < 0.3) {
      const ai = new BotAI(bot, game);
      const alivePlayers = game.players.filter(
        (p) => p.alive && p.id !== bot.id,
      );

      // Choose target based on personality
      let target;
      if (bot.memory?.allies?.length > 0) {
        // Prefer allies
        const allies = alivePlayers.filter((p) =>
          bot.memory.allies.includes(p.color),
        );
        if (allies.length > 0) {
          target = allies[Math.floor(Math.random() * allies.length)];
        }
      }

      if (!target) {
        target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      }

      if (target) {
        const delay = 3000 + Math.random() * 5000;

        const timer = setTimeout(() => {
          io.to(gameId).emit("dm-requested", {
            from: bot.color,
            to: target.color,
          });

          console.log(`📨 Bot ${bot.name} requested DM with ${target.name}`);
        }, delay);

        addTimer(gameId, timer);
      }
    }
  });
}

export default {
  initializeBots,
  handleBotPhase,
  updateBotMemories,
  clearBotTimers,
};
