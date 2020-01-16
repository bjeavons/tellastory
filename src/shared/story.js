let data = require('@begin/data');

async function pendingGame(storyKey) {
    let response = await data.get({ table: 'pending', key: storyKey }); 
    return response !== null ? response.participant : null;
}

async function startGame(participant, storyKey) {
    console.log('Pending game on', storyKey, ', awaiting additional participants');
    await data.set({
        table: 'pending',
        key: storyKey,
        participant
    });
    await data.set({
        table: 'participant',
        key: participant,
        storyKey
    });
}

async function joinGame(participant, storyKey) {
    // If there's a pending story then join it else start a pending story.
    let pendingStory = await data.get({ table: 'pending', key: storyKey });
    if (pendingStory === null) {
        console.log('No pending game on', storyKey);
        throw new Error();
    }
    else {
        // Upgrade from pending to full story and remove pending.
        console.log('Starting game on', storyKey);
        let game = {
            participant_1: pendingStory.participant,
            participant_2: participant,
            story: null,
            created: Date.now()
        };
        await data.set({
            table: 'story',
            key: storyKey,
            ...game
        });
        await data.set({
            table: 'participant',
            key: participant,
            storyKey
        });
        await data.destroy({
            table: 'pending',
            key: storyKey
        })
    }
}

async function getGame(participant) {
    let record = await data.get({ table: 'participant', key: participant });
    if (record === null) {
        console.log('Not a game participant', participant);
        return false;
    }
    let story = await data.get({ table: 'story', key: record.storyKey });
    if (story === null) {
        console.log('No active game on', record.storyKey);
        return false;
    }
    console.log('Matched game with participants', story.participant_1, story.participant_2);
    return story;
}

async function leaveGame(participant) {
    let record = await data.get({ table: 'participant', key: participant });
    if (record === null) {
        console.log('Not a game participant', participant);
        return false;
    }
    else {
        let game = await getGame(participant);
        await data.destroy({
            table: 'game',
            key: record.storyKey
        });
        await data.destroy({
            table: 'participant',
            key: game.participant_1
        });
        await data.destroy({
            table: 'participant',
            key: game.participant_2
        });
        return true;
    }
}

function getNextPlayer(game, sender) {
    if (game.participant_1 === sender) {
        return game.participant_2;
    }
    else {
        return game.participant_1;
    }
}

function getStory(game) {
    return game.story;
}

async function updateStory(game, story) {
    game.story = story;
    await data.set({
        table: 'story',
        key: game.storyKey,
        ...game
    });
}

module.exports = {
    pending: pendingGame,
    start: startGame,
    join: joinGame,
    get: getGame,
    leave: leaveGame,
    getNextPlayer: getNextPlayer,
    getStory: getStory,
    updateStory: updateStory
}