const EVENT_DECK = [
  {
    id: "trust-fall",
    name: "Trust Fall",
    description: "All players who voted for the same collab gain +1 Aura",
    effect: (game) => {
      const changes = [];
      const collabVotes = {};

      // Group players by their collab vote
      game.collabProposals?.forEach((proposal) => {
        proposal.votes.forEach((voter) => {
          if (!collabVotes[proposal.id]) collabVotes[proposal.id] = [];
          collabVotes[proposal.id].push(voter);
        });
      });

      // Bonus for groups of 2+
      Object.values(collabVotes).forEach((voters) => {
        if (voters.length >= 2) {
          voters.forEach((color) => {
            changes.push({ color, auraChanges: 1, reason: "Trust Fall event" });
          });
        }
      });

      return changes;
    },
  },
  {
    id: "paranoia",
    name: "Paranoia",
    description: "All defensive actions this round cost double Aura",
    effect: (game) => {
      const changes = [];
      Object.entries(game.abilities || {}).forEach(([color, action]) => {
        if (action.ability === "defend") {
          changes.push({
            color,
            auraChanges: -0.5,
            reason: "Paranoia event penalty",
          });
        }
      });
      return changes;
    },
  },
  {
    id: "solidarity",
    name: "Solidarity",
    description: "Players who didn't attack or sabotage gain +1 Aura",
    effect: (game) => {
      const changes = [];
      const hostileActions = new Set();

      Object.entries(game.abilities || {}).forEach(([color, action]) => {
        if (
          ["attack", "sabotage", "invisibleSabotage"].includes(action.ability)
        ) {
          hostileActions.add(color);
        }
      });

      game.players
        .filter((p) => p.alive)
        .forEach((player) => {
          if (!hostileActions.has(player.color)) {
            changes.push({
              color: player.color,
              auraChange: 1,
              reason: "Solidarity event",
            });
          }
        });
      return changes;
    },
  },
  {
    id: "betrayal",
    name: "Betrayal",
    description: "Collab host must defend someone or lose 2 Aura",
    effect: (game) => {
      const changes = [];
      const host = game.collabHost;
      if (!host) return changes;

      const hostAction = game.abilities?.[host];
      if (!hostAction || hostAction.ability !== "defend") {
        changes.push({
          color: host,
          auraChange: -2,
          reason: "Betrayal event - didn't defend",
        });
      }
      return changes;
    },
  },
  {
    id: "healing-circle",
    name: "Healing Circle",
    description:
      "All heal actions this round are guaranteed successful (+1 Aura to healer)",
    modifier: "healing-boost",
  },
  {
    id: "chaos",
    name: "Chaos",
    description: "All sabotage action are invisible this round",
    modifier: "invisible-sabotage",
  },
  {
    id: "the-reveal",
    name: "The Reveal",
    description: "Everyone learns how many Doomers are still alive",
    effect: (game) => {
      const aliveDoomerCount = game.players.filter(
        (p) => p.alive && p.role === "doomer"
      ).length;
      return { reveal: { type: "doomer-count", count: aliveDoomerCount } };
    },
  },
  {
    id: "double-down",
    name: "Double Down",
    description:
      "Vote outcomes this round have double the Aura impact (±1 Aura)",
    modifier: "double-vote",
  },
  {
    id: "forced-alliance",
    name: "Forced Alliance",
    description: "No collab proposals this round - random pairs are assigned",
    modifier: "random-collab",
  },
  {
    id: "power-shift",
    name: "Power Shift",
    description:
      "Player with the lowest Aura gains +2 Aura, highest loses -1 Aura",
    effect: (game) => {
      const changes = [];
      const alive = game.players.filter((p) => p.alive);
      if (alive.length === 0) return changes;

      const lowest = alive.reduce((min, p) => (p.aura < min.aura ? p : min));
      const highest = alive.reduce((max, p) => (p.aura > max.aura ? p : max));

      changes.push({
        color: lowest.color,
        auraChange: 2,
        reason: "Power Shift - lowest",
      });
      if (lowest.color !== highest.color) {
        changes.push({
          color: highest.color,
          auraChange: -1,
          reason: "Power Shift - highest",
        });
      }
      return changes;
    },
  },
  {
    id: "immunity",
    name: "Immunity",
    description: "First player attacked this round takes no damage",
    modifier: "first-attack-immune",
  },
  {
    id: "expose",
    name: "Expose",
    description: "All attacks are revealed to everyone (attack and target)",
    modifier: "reveal-attacks",
  },
];

const EVENT_ENABLED = false;

export const drawRandomEvent = () => {
  if (!EVENT_ENABLED) return null;

  const randomIndex = Math.floor(Math.random() * EVENT_DECK.length);
  return EVENT_DECK[randomIndex];
};

export const createInitialGameState = (players) => {
  // Assign roles: 2 doomers, rest vibers
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const roles = [
    ...Array(2).fill("doomer"),
    ...Array(players.length - 2).fill("viber"),
  ].sort(() => Math.random() - 0.5);

  return {
    phase: "STARTING",
    round: 1,
    phaseTimer: null,

    players: shuffled.map((p, i) => ({
      id: p.id,
      color: p.color,
      role: roles[i],
      alive: true,
      aura: 0,
      vibe: 2,
      note: "",
      buffedAttack: false, // For doomer double damage
    })),

    collabProposals: [],
    currentCollab: null,
    collabHost: null,

    abilities: {},
    votes: {},

    currentEvent: null,
    eventModifiers: [],

    dmRequests: {},
    activeRomms: [],

    winners: [],
  };
};
