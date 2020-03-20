const data = require('@begin/data');
const gameplayer = require('@architect/shared/player');

async function pendingGame(storyKey) {
    let game = await data.get({ table: 'game', key: storyKey });
    return game !== null ? game : null;
}

async function startDemo(player_id, story) {
    console.log('Start demo game for', player_id);
    await data.set({
        table: 'demo',
        key: player_id,
        ttl: Date.now() + (60*60*24),
        story: story,
        created: Date.now(),
        updated: Date.now()
    });
}

async function getDemoStory(player_id) {
    let record = await data.get({ table: 'demo', key: player_id });
    if (record === null) {
        console.log('No demo game for', player_id);
        return false;
    }
    return record.story;
}

async function endDemo(player_id) {
    await data.destroy({ table: 'demo', key: player_id });
}

async function updateDemo(player_id, story) {
    let demo = await data.get({ table: 'demo', key: player_id });
    demo.story = story;
    demo.updated = Date.now();
    await data.set({
        table: 'demo',
        key: player_id,
        ...demo
    });
}

async function setupGame(player_id, storyKey) {
    console.log('Set up game for', storyKey, ', awaiting additional players');
    await data.set({
        table: 'game',
        key: storyKey,
        creator: player_id,
        players: [player_id],
        story: null,
        started: false,
        created: Date.now(),
        updated: Date.now()
    });
    await data.set({
        table: 'gameplayer',
        key: player_id,
        created: Date.now(),
        storyKey
    });
}

async function joinGame(player_id, storyKey) {
    // If there's a game join it.
    let game = await data.get({ table: 'game', key: storyKey });
    if (game === null) {
        console.log('No pending game for', storyKey);
        throw new Error();
    }
    else {
        // Join game.
        console.log('Joining player', player_id,' to game', storyKey);
        game.players.push(player_id);
        game.updated = Date.now();
        await data.set({
            table: 'game',
            key: storyKey,
            ...game
        });
        await data.set({
            table: 'gameplayer',
            key: player_id,
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
    // Activate game for all players.
    game.players.map(async function (p) {
        await gameplayer.activate(p)
    });
}

async function getGame(player_id) {
    let record = await data.get({ table: 'gameplayer', key: player_id });
    if (record === null) {
        console.log('Not a game player', player_id);
        return false;
    }
    let game = await data.get({ table: 'game', key: record.storyKey });
    if (game === null) {
        console.log('No active game for', record.storyKey);
        return false;
    }
    return game;
}

async function leaveGame(player_id) {
    let record = await data.get({ table: 'gameplayer', key: player_id });
    if (record === null) {
        console.log('Not a game player', player_id);
        return false;
    }

    let game = await getGame(player_id);
    game.players = game.players.filter(function (e) {
        return e != this;
    }, player_id);
    game.updated = Date.now();

    await data.set({
        table: 'game',
        key: game.key,
        ...game
    });
    await gameplayer.deactivate(player_id);
    await data.destroy({
        table: 'gameplayer',
        key: player_id
    });

    console.log('Game', game.key, 'now with players', game.players);
    return game;
}

async function endGame(player_id) {
    let record = await data.get({ table: 'gameplayer', key: player_id });
    if (record === null) {
        console.log('Not a game player', player_id);
        return false;
    }
    let game = await getGame(player_id);
    if (game.creator !== player_id) {
        console.log('Not game creator', player_id);
        return false;
    }

    game.players.map(async function (p) {
        await gameplayer.deactivate(p);

        await data.destroy({
            table: 'gameplayer',
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

function isCreator(game, player_id) {
    return game.creator === player_id;
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

function getNextPlayer(game, player_id) {
    let eligible = game.players.filter(function (e) {
        return e != this;
    }, player_id);
    return eligible[Math.floor(Math.random() * Math.floor(eligible.length))];
}

function getStory(game) {
    return game.story;
}

async function updateStory(game, story) {
    game.story = story;
    game.updated = Date.now();
    await data.set({
        table: 'game',
        key: game.key,
        ...game
    });
}

module.exports = {
    pending: pendingGame,
    demo: startDemo,
    getDemoStory: getDemoStory,
    updateDemo: updateDemo,
    endDemo: endDemo,
    setup: setupGame,
    join: joinGame,
    get: getGame,
    start: startGame,
    leave: leaveGame,
    end: endGame,
    isCreator: isCreator,
    getCreator: getCreator,
    hasStarted: hasStarted,
    getPlayerCount, getPlayerCount,
    getNextPlayer: getNextPlayer,
    getStory: getStory,
    updateStory: updateStory
}