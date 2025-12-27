export const createInitialGameState = (players) => {
    // Assign roles: 2 doomers, rest vibers
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const roles = [
        ...Array(2).fill("doomer"),
        ...Array(players.length - 2).fill("viber")
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
            buffedAttack: false // For doomer double damage
        })),

        collabProposals: [],
        currentCollab: null,
        collabHost: null,

        abilities: {},
        votes: {},

        dmRequests: {},
        activeRomms: [],

        winners: []
    };
};