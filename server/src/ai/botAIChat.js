import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE",
);

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

// Create a chat context for each bot
class BotChatAI {
  constructor(bot, game) {
    this.bot = bot;
    this.game = game;
    this.personality = bot.personality;
    this.model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    this.conversationHistory = [];
  }

  // Build context about the game state
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

  // Generate a chat message
  async generateMessage(context = "", messageType = "general") {
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
      console.error("Gemini API error:", error);
      // Fallback responses
      return this.getFallbackMessage(messageType);
    }
  }

  // Fallback messages if API fails
  getFallbackMessage(messageType) {
    const fallbacks = {
      AGGRESSIVE: [
        "Let's make a move now!",
        "I'm voting them out.",
        "We need to be more aggressive.",
      ],
      CAUTIOUS: [
        "Let me think about this...",
        "I'm not sure yet.",
        "We should be careful here.",
      ],
      STRATEGIC: [
        "Based on the pattern...",
        "Statistically speaking...",
        "Let me analyze this.",
      ],
      SOCIAL: [
        "Hey everyone! Thoughts?",
        "Let's work together!",
        "What do you all think?",
      ],
      CHAOTIC: ["CHAOS TIME!!!", "lol what if we just...", "Random thought:"],
      ANALYTICAL: [
        "Looking at the data...",
        "My analysis shows...",
        "The numbers suggest...",
      ],
      LOYAL: [
        "I'm with my allies on this.",
        "We stick together.",
        "Trust is important.",
      ],
      OPPORTUNISTIC: [
        "This could work in my favor.",
        "Interesting opportunity...",
        "Let's see how this plays out.",
      ],
    };

    const messages = fallbacks[this.personality] || ["..."];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Decide whether to accept a DM request
  async decideDMResponse(requester) {
    try {
      const requesterPlayer = this.game.players.find(
        (p) => p.color === requester,
      );
      const isAlly = this.bot.memory?.allies?.includes(requester);
      const isEnemy = this.bot.memory?.enemies?.includes(requester);

      const prompt = `${PERSONALITY_PROMPTS[this.personality]}

${this.buildGameContext()}

${requesterPlayer.name} (${requester}) wants to have a private DM with you.
- They are ${isAlly ? "your ally" : isEnemy ? "your enemy" : "neutral"}
- Their stats: Aura ${requesterPlayer.aura}, Vibe ${requesterPlayer.vibe}

Should you accept this DM? Respond with ONLY "ACCEPT" or "REJECT" and a brief reason (max 20 words).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().toUpperCase();

      const shouldAccept = text.includes("ACCEPT");
      const reason = text.replace("ACCEPT", "").replace("REJECT", "").trim();

      return { accept: shouldAccept, reason };
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback logic
      return this.getFallbackDMDecision(requester);
    }
  }

  // Fallback DM decision
  getFallbackDMDecision(requester) {
    const isAlly = this.bot.memory?.allies?.includes(requester);
    const isEnemy = this.bot.memory?.enemies?.includes(requester);

    // Personality-based decision
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

  // Generate a DM message
  async generateDMMessage(recipient, previousMessages = []) {
    try {
      const recipientPlayer = this.game.players.find(
        (p) => p.color === recipient,
      );
      const context = previousMessages
        .slice(-5)
        .map(
          (msg) =>
            `${msg.senderColor === this.bot.color ? "You" : recipientPlayer.name}: ${msg.message}`,
        )
        .join("\n");

      const prompt = `${PERSONALITY_PROMPTS[this.personality]}

${this.buildGameContext()}

You are in a PRIVATE DM with ${recipientPlayer.name} (${recipient}).

Previous conversation:
${context || "This is the start of the conversation."}

Generate your next message in this private conversation. Consider:
- Your relationship with them
- What information you want to share or extract
- Your goals in this conversation

Keep it under 40 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackMessage("dm");
    }
  }

  // Analyze voting decision
  async analyzeVotingDecision(targetOptions) {
    try {
      const targets = targetOptions
        .map((t) => {
          const player = this.game.players.find((p) => p.color === t);
          return `${player.name} (${t}): Aura ${player.aura}, Vibe ${player.vibe}`;
        })
        .join("\n");

      const prompt = `${PERSONALITY_PROMPTS[this.personality]}

${this.buildGameContext()}

You need to vote someone out. Options:
${targets}

Who should you vote for and why? Respond with just the COLOR and a brief reason (max 30 words).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract color from response
      const mentionedColor = targetOptions.find((color) =>
        text.toLowerCase().includes(color.toLowerCase()),
      );

      return {
        target: mentionedColor || targetOptions[0],
        reasoning: text,
      };
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback to regular AI logic
      return null;
    }
  }
}

// Generate a public chat message based on game events
export async function generateBotChatMessage(bot, game, context) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.generateMessage(context);
}

// Decide if bot accepts DM
export async function decideBotDMResponse(bot, game, requester) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.decideDMResponse(requester);
}

// Generate DM message
export async function generateBotDMMessage(
  bot,
  game,
  recipient,
  previousMessages,
) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.generateDMMessage(recipient, previousMessages);
}

// Analyze voting with AI
export async function analyzeBotVoting(bot, game, targets) {
  const chatAI = new BotChatAI(bot, game);
  return await chatAI.analyzeVotingDecision(targets);
}

export default BotChatAI;
