import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENHANCED_FALLBACKS } from "./botFallbackMessages.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// TOGGLE: Set to false to disable all API calls and use only fallbacks
const USE_AI_API = false;

// System prompts for different personalities
const PERSONALITY_PROMPTS = {
  AGGRESSIVE: `You are an aggressive player in a social deduction game. You're bold, confrontational, and push your agenda hard. Keep messages under 50 words. Be direct and assertive. Use confident language.`,
  CAUTIOUS: `You are a cautious, observant player. You think before you speak, ask questions, and rarely make bold claims. Keep messages under 50 words. Be thoughtful and hesitant.`,
  STRATEGIC: `You are a strategic, analytical player. You reference patterns, statistics, and logical reasoning. Keep messages under 50 words. Be methodical and calculated.`,
  SOCIAL: `You are a friendly, alliance-building player. You're warm, supportive, and try to make connections. Keep messages under 50 words. Be encouraging and collaborative.`,
  CHAOTIC: `You are unpredictable and random. Your messages are quirky and sometimes don't follow logic. Keep messages under 50 words. Be weird and unexpected.`,
  ANALYTICAL: `You are highly analytical and data-focused. You cite specific numbers and observations. Keep messages under 50 words. Be precise and detail-oriented.`,
  LOYAL: `You are fiercely loyal to your allies. You defend your friends and question outsiders. Keep messages under 50 words. Be protective and steadfast.`,
  OPPORTUNISTIC: `You are opportunistic and self-serving. You switch sides when beneficial. Keep messages under 50 words. Be adaptable and pragmatic.`,
};

class BotChatAI {
  constructor(bot, game) {
    this.bot = bot;
    this.game = game;
    this.personality = bot.personality;
    this.model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
    this.conversationHistory = [];
  }

  buildGameContext() {
    const alive = this.game.players.filter((p) => p.alive);
    const myAllies = this.bot.memory?.allies || [];
    const myEnemies = this.bot.memory?.enemies || [];

    return `
GAME STATE:
- You are: ${this.bot.name} (${this.bot.color})
- Your role: ${this.bot.role}
- Your stats: Aura ${this.bot.aura}/10, Vibe ${this.bot.vibe}/10
- Phase: ${this.game.phase}
- Round: ${this.game.round}
- Players alive: ${alive.length}
- Your allies: ${myAllies.join(", ") || "none"}
- Your enemies: ${myEnemies.join(", ") || "none"}

PLAYERS:
${alive.map((p) => `- ${p.name} (${p.color}): Aura ${p.aura}, Vibe ${p.vibe}`).join("\n")}
`;
  }

  // Get enhanced fallback message based on phase and personality
  getEnhancedFallback(phase = "general") {
    const personalityMessages =
      ENHANCED_FALLBACKS[this.personality] || ENHANCED_FALLBACKS.SOCIAL;
    const phaseMessages =
      personalityMessages[phase] || personalityMessages.general;
    return phaseMessages[Math.floor(Math.random() * phaseMessages.length)];
  }

  async generateMessage(context = "", messageType = "general") {
    // Skip API if disabled or quota exceeded
    if (!USE_AI_API) {
      console.log(`🤖 Using fallback (API disabled) for ${this.bot.name}`);
      return this.getEnhancedFallback(this.game.phase);
    }

    try {
      const systemPrompt = PERSONALITY_PROMPTS[this.personality];
      const gameContext = this.buildGameContext();

      let prompt = `${systemPrompt}

${gameContext}

${context}

Generate a single chat message as this player. Stay in character.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim();
    } catch (error) {
      if (error.status === 429) {
        console.log(`⏳ Quota exceeded - using fallback for ${this.bot.name}`);
      } else {
        console.error("Gemini API error:", error.message);
      }
      return this.getEnhancedFallback(this.game.phase);
    }
  }

  getFallbackDMDecision(requester) {
    const isAlly = this.bot.memory?.allies?.includes(requester);
    const isEnemy = this.bot.memory?.enemies?.includes(requester);

    switch (this.personality) {
      case "AGGRESSIVE":
        return { accept: !isEnemy, reason: "Let's talk" };
      case "CAUTIOUS":
        return { accept: isAlly, reason: "Only trust allies" };
      case "SOCIAL":
        return { accept: true, reason: "Always open to chat!" };
      case "CHAOTIC":
        return { accept: Math.random() > 0.5, reason: "Why not?" };
      case "LOYAL":
        return { accept: isAlly, reason: "Sticking with my team" };
      case "OPPORTUNISTIC":
        return { accept: true, reason: "Might be useful" };
      default:
        return { accept: !isEnemy, reason: "Sure" };
    }
  }

  async decideDMResponse(requester) {
    // Always use fallback for DM decisions (less critical)
    return this.getFallbackDMDecision(requester);
  }

  async generateDMMessage(recipient, previousMessages = []) {
    return this.getEnhancedFallback("DM_PHASE");
  }

  async analyzeVotingDecision(targetOptions) {
    // Fallback voting logic
    const ai = {
      chooseVoteTarget: () => {
        // Simple AI: vote for someone with low aura or an enemy
        const enemies = this.game.players.filter(
          (p) => this.bot.memory?.enemies?.includes(p.color) && p.alive,
        );

        if (enemies.length > 0) {
          return enemies[0].color;
        }

        // Otherwise vote for weakest player
        const alivePlayers = this.game.players
          .filter((p) => p.alive && p.id !== this.bot.id)
          .sort((a, b) => a.aura - b.aura);

        return alivePlayers[0]?.color || targetOptions[0];
      },
    };

    return {
      target: ai.chooseVoteTarget(),
      reasoning: this.getEnhancedFallback("ACTION_PHASE"),
    };
  }
}

export async function generateBotChatMessage(bot, game, context) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.generateMessage(context);
}

export async function decideBotDMResponse(bot, game, requester) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.decideDMResponse(requester);
}

export async function generateBotDMMessage(
  bot,
  game,
  recipient,
  previousMessages,
) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.generateDMMessage(recipient, previousMessages);
}

export async function analyzeBotVoting(bot, game, targets) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.analyzeVotingDecision(targets);
}

export default BotChatAI;
