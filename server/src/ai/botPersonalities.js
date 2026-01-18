// botPersonalities.js
// AI personalities for bot players with distinct strategies and behaviors

export const BOT_PERSONALITIES = {
  AGGRESSIVE: {
    name: "Aggressive",
    description: "Plays aggressively, proposes collabs often, votes quickly",
    collabProposalChance: 0.85, // High chance to propose collab
    skipVoteChance: 0.1, // Low chance to skip
    voteDecisionSpeed: "fast", // Decides quickly
    abilityUsageStyle: "offensive", // Prefers offensive abilities
    trustLevel: 0.3, // Low trust in others
    suspicionThreshold: 0.6, // Quick to suspect
  },

  CAUTIOUS: {
    name: "Cautious",
    description: "Plays defensively, observes before acting",
    collabProposalChance: 0.3,
    skipVoteChance: 0.4,
    voteDecisionSpeed: "slow",
    abilityUsageStyle: "defensive",
    trustLevel: 0.7,
    suspicionThreshold: 0.8,
  },

  STRATEGIC: {
    name: "Strategic",
    description: "Analyzes patterns, makes calculated moves",
    collabProposalChance: 0.5,
    skipVoteChance: 0.25,
    voteDecisionSpeed: "medium",
    abilityUsageStyle: "tactical",
    trustLevel: 0.5,
    suspicionThreshold: 0.65,
  },

  SOCIAL: {
    name: "Social",
    description: "Builds alliances, supports others frequently",
    collabProposalChance: 0.7,
    skipVoteChance: 0.15,
    voteDecisionSpeed: "medium",
    abilityUsageStyle: "supportive",
    trustLevel: 0.8,
    suspicionThreshold: 0.75,
  },

  CHAOTIC: {
    name: "Chaotic",
    description: "Unpredictable behavior, random decisions",
    collabProposalChance: 0.6,
    skipVoteChance: 0.35,
    voteDecisionSpeed: "random",
    abilityUsageStyle: "random",
    trustLevel: 0.5,
    suspicionThreshold: 0.5,
  },

  ANALYTICAL: {
    name: "Analytical",
    description: "Data-driven, focuses on statistics and patterns",
    collabProposalChance: 0.4,
    skipVoteChance: 0.3,
    voteDecisionSpeed: "slow",
    abilityUsageStyle: "optimal",
    trustLevel: 0.6,
    suspicionThreshold: 0.7,
  },

  LOYAL: {
    name: "Loyal",
    description: "Sticks with allies, defensive of partners",
    collabProposalChance: 0.55,
    skipVoteChance: 0.2,
    voteDecisionSpeed: "medium",
    abilityUsageStyle: "protective",
    trustLevel: 0.9,
    suspicionThreshold: 0.85,
  },

  OPPORTUNISTIC: {
    name: "Opportunistic",
    description: "Exploits weaknesses, switches allegiances",
    collabProposalChance: 0.65,
    skipVoteChance: 0.2,
    voteDecisionSpeed: "fast",
    abilityUsageStyle: "exploitative",
    trustLevel: 0.4,
    suspicionThreshold: 0.55,
  },
};

// Assign random personality to bot
export function assignBotPersonality(botPlayer) {
  const personalities = Object.keys(BOT_PERSONALITIES);
  const randomPersonality =
    personalities[Math.floor(Math.random() * personalities.length)];

  return {
    ...botPlayer,
    personality: randomPersonality,
    personalityData: BOT_PERSONALITIES[randomPersonality],
    memory: {
      allies: [],
      enemies: [],
      suspicions: {},
      collabHistory: [],
    },
  };
}

// Bot decision-making logic
export class BotAI {
  constructor(bot, game) {
    this.bot = bot;
    this.game = game;
    this.personality = bot.personalityData;
  }

  // Decide whether to propose collab
  shouldProposeCollab() {
    const random = Math.random();
    const baseChance = this.personality.collabProposalChance;

    // Modify chance based on game state
    let chance = baseChance;

    // If bot has low aura, increase chance (needs help)
    if (this.bot.aura < 3) {
      chance += 0.15;
    }

    // If bot is winning, decrease chance
    if (this.bot.aura > 7) {
      chance -= 0.1;
    }

    // If few players remain, increase chance
    const alivePlayers = this.game.players.filter((p) => p.alive).length;
    if (alivePlayers <= 4) {
      chance += 0.1;
    }

    return random < chance;
  }

  // Choose which collab to vote for
  chooseCollabVote(proposals) {
    const personality = this.personality;

    // CHAOTIC: Random choice
    if (this.bot.personality === "CHAOTIC") {
      const allOptions = [...proposals, { id: "skip" }];
      return allOptions[Math.floor(Math.random() * allOptions.length)].id;
    }

    // CAUTIOUS: Likely to skip
    if (this.bot.personality === "CAUTIOUS") {
      if (Math.random() < personality.skipVoteChance) {
        return "skip";
      }
    }

    // Score each proposal
    const scores = proposals.map((proposal) => {
      let score = 0;

      const proposer = this.game.players.find(
        (p) => p.color === proposal.proposer,
      );

      // Factor 1: Is proposer an ally?
      if (this.bot.memory.allies.includes(proposal.proposer)) {
        score += 30;
      }

      // Factor 2: Is proposer an enemy?
      if (this.bot.memory.enemies.includes(proposal.proposer)) {
        score -= 40;
      }

      // Factor 3: Proposer's aura
      if (proposer) {
        score += proposer.aura * 3;
      }

      // Factor 4: Number of existing votes (bandwagon)
      score += proposal.votes.length * 5;

      // Factor 5: Personality-specific adjustments
      if (this.bot.personality === "SOCIAL") {
        score += proposal.votes.length * 8; // Extra bandwagon
      }

      if (this.bot.personality === "OPPORTUNISTIC") {
        // Vote for whoever is winning
        score += proposal.votes.length * 10;
      }

      return { proposal, score };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Decide whether to vote or skip
    if (scores.length === 0 || scores[0].score < 10) {
      return "skip";
    }

    return scores[0].proposal.id;
  }

  // Choose vote target during voting phase
  chooseVoteTarget() {
    const alivePlayers = this.game.players.filter(
      (p) => p.alive && p.id !== this.bot.id,
    );

    if (alivePlayers.length === 0) return null;

    // CHAOTIC: Random target
    if (this.bot.personality === "CHAOTIC") {
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
        .color;
    }

    // Score each player
    const scores = alivePlayers.map((player) => {
      let score = 0;

      // Factor 1: High aura = bigger threat
      score += player.aura * 10;

      // Factor 2: Enemy status
      if (this.bot.memory.enemies.includes(player.color)) {
        score += 50;
      }

      // Factor 3: Ally status (negative score)
      if (this.bot.memory.allies.includes(player.color)) {
        score -= 100;
      }

      // Factor 4: Suspicion level
      const suspicion = this.bot.memory.suspicions[player.color] || 0;
      score += suspicion * 20;

      // Personality adjustments
      if (this.bot.personality === "AGGRESSIVE") {
        // Target strongest player
        score += player.aura * 15;
      }

      if (this.bot.personality === "STRATEGIC") {
        // Consider vibe as well
        score += player.vibe * 5;
      }

      if (this.bot.personality === "OPPORTUNISTIC") {
        // Target weak players
        score -= player.aura * 10;
        score += (10 - player.aura) * 15;
      }

      return { player, score };
    });

    scores.sort((a, b) => b.score - a.score);

    return scores[0].player.color;
  }

  // Choose ability target
  chooseAbilityTarget(ability) {
    const alivePlayers = this.game.players.filter(
      (p) => p.alive && p.id !== this.bot.id,
    );

    if (alivePlayers.length === 0) return null;

    const style = this.personality.abilityUsageStyle;

    // Different strategies based on personality
    switch (style) {
      case "offensive":
        // Target highest aura
        return alivePlayers.reduce((max, p) => (p.aura > max.aura ? p : max))
          .color;

      case "defensive":
        // Target allies or self
        const allies = alivePlayers.filter((p) =>
          this.bot.memory.allies.includes(p.color),
        );
        if (allies.length > 0) {
          return allies[0].color;
        }
        return this.bot.color;

      case "tactical":
        // Target based on game state
        if (this.bot.aura < 4) {
          // Defensive if weak
          return this.bot.color;
        } else {
          // Offensive if strong
          return alivePlayers.reduce((max, p) => (p.aura > max.aura ? p : max))
            .color;
        }

      case "exploitative":
        // Target weakest player
        return alivePlayers.reduce((min, p) => (p.aura < min.aura ? p : min))
          .color;

      case "random":
        return alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          .color;

      default:
        return alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          .color;
    }
  }

  // Update memory based on game events
  updateMemory(event) {
    switch (event.type) {
      case "collab_success":
        // Add partner as ally
        if (event.partner && !this.bot.memory.allies.includes(event.partner)) {
          this.bot.memory.allies.push(event.partner);
        }
        break;

      case "voted_for_me":
        // Mark as enemy
        if (event.voter && !this.bot.memory.enemies.includes(event.voter)) {
          this.bot.memory.enemies.push(event.voter);
          this.bot.memory.suspicions[event.voter] =
            (this.bot.memory.suspicions[event.voter] || 0) + 0.3;
        }
        break;

      case "ability_used_on_me":
        // Increase suspicion
        if (event.user) {
          this.bot.memory.suspicions[event.user] =
            (this.bot.memory.suspicions[event.user] || 0) + 0.2;
        }
        break;

      case "player_eliminated":
        // Remove from memory
        this.bot.memory.allies = this.bot.memory.allies.filter(
          (a) => a !== event.player,
        );
        this.bot.memory.enemies = this.bot.memory.enemies.filter(
          (e) => e !== event.player,
        );
        break;
    }
  }

  // Get decision timing delay (in ms)
  getDecisionDelay() {
    const speed = this.personality.voteDecisionSpeed;

    switch (speed) {
      case "fast":
        return 1000 + Math.random() * 2000; // 1-3s
      case "medium":
        return 3000 + Math.random() * 4000; // 3-7s
      case "slow":
        return 5000 + Math.random() * 5000; // 5-10s
      case "random":
        return Math.random() * 8000; // 0-8s
      default:
        return 3000 + Math.random() * 3000;
    }
  }
}

export default BotAI;
