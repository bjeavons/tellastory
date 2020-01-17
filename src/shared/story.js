let data = require('@begin/data');

async function pendingGame(storyKey) {
    let game = await data.get({ table: 'game', key: storyKey });
    return game !== null ? game : null;
}

async function setupGame(creator, storyKey) {
    console.log('Set up game for', storyKey, ', awaiting additional players');
    await data.set({
        table: 'game',
        key: storyKey,
        creator: creator,
        players: [creator],
        story: null,
        started: false,
        created: Date.now(),
        updated: Date.now()
    });
    await data.set({
        table: 'player',
        key: creator,
        created: Date.now(),
        storyKey
    });
}

async function joinGame(player, storyKey) {
    // If there's a pending game join it.
    let game = await data.get({ table: 'game', key: storyKey });
    if (game === null) {
        console.log('No pending game for', storyKey);
        throw new Error();
    }
    else {
        // Join game.
        console.log('Joining player', player,' to game', storyKey);
        game.players.push(player);
        game.updated = Date.now();
        await data.set({
            table: 'game',
            key: storyKey,
            ...game
        });
        await data.set({
            table: 'player',
            key: player,
            created: Date.now(),
            storyKey
        });
        return game;
    }
}

async function startGame(game) {
    game.started = true;
    game.updated = Date.now();
    /**
     * @todo move story to own table
     */
    await data.set({
        table: 'game',
        key: game.key,
        ...game
    });
}

async function getGame(player) {
    let record = await data.get({ table: 'player', key: player });
    if (record === null) {
        console.log('Not a game player', player);
        return false;
    }
    let game = await data.get({ table: 'game', key: record.storyKey });
    if (game === null) {
        console.log('No active game for', record.storyKey);
        return false;
    }
    console.log('Found game with players', game.players.join(" "));
    return game;
}

async function leaveGame(player) {
    let record = await data.get({ table: 'player', key: player });
    if (record === null) {
        console.log('Not a game player', player);
        return false;
    }

    let game = await getGame(player);
    game.players = game.players.filter(function (e) {
        return e != this;
    }, player);
    game.updated = Date.now();

    await data.set({
        table: 'game',
        key: game.key,
        ...game
    });
    await data.destroy({
        table: 'player',
        key: player
    });
    console.log('Game', game.key, 'now with players', game.players);
    return game;
}

async function endGame(player) {
    let record = await data.get({ table: 'player', key: player });
    if (record === null) {
        console.log('Not a game player', player);
        return false;
    }
    let game = await getGame(player);
    if (game.creator !== player) {
        console.log('Not game creator', player);
        return false;
    }

    game.players.map(async function (p) {
        await data.destroy({
            table: 'player',
            key: p
        });
    });
    await data.destroy({
        table: 'game',
        key: game.key
    });
    /**
     * @todo archive the story?
     */
    console.log('Game', game.key, 'and all players removed');
    return true;
}

function getCreator(game) {
    return game.creator;
}

function hasStarted(game) {
    return game.started;
}

function getPlayerCount(game) {
    return game.players.length;
}

function getNextPlayer(game, sender) {
    let eligible = game.players.filter(function (e) {
        return e != this;
    }, sender);
    return eligible[Math.floor(Math.random() * Math.floor(eligible.length))];
}

function getStory(game) {
    return game.story;
}

async function updateStory(game, story) {
    game.story = story;
    await data.set({
        table: 'game',
        key: game.key,
        ...game
    });
}

module.exports = {
    pending: pendingGame,
    setup: setupGame,
    join: joinGame,
    get: getGame,
    start: startGame,
    leave: leaveGame,
    end: endGame,
    getCreator: getCreator,
    hasStarted: hasStarted,
    getPlayerCount, getPlayerCount,
    getNextPlayer: getNextPlayer,
    getStory: getStory,
    updateStory: updateStory
}