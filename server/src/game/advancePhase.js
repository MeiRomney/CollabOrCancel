export const advancePhase = (game) => {
    switch(game.phase) {
        case "PLAY": 
            game.phase = "VOTE";
            break;
        case "VOTE":
            game.phase = "RESOLUTION";
            break;
        case "RESOLUTION":
            game.round += 1;
            game.phase = "PLAY";
            game.abilities = {};
            game.votes = {};
            break;
    }
};