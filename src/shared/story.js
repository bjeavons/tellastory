let data = require('@begin/data');

async function pendingStory(storyKey) {
    let response = await data.get({ table: 'pending', key: storyKey }); 
    return response !== null ? response.participant : null;
}

async function startStory(participant, storyKey) {
    console.log('Starting story on', storyKey, 'awaiting additional participants');
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

async function joinStory(participant, storyKey) {
    // If there's a pending story then join it else start a pending story.
    let pendingStory = await data.get({ table: 'pending', key: storyKey });
    if (pendingStory === null) {
        console.log('No pending story on', storyKey);
        throw new Error();
    }
    else {
        // Upgrade from pending to full story and remove pending.
        console.log('Starting story on', storyKey);
        let story = {
            participant_1: pendingStory.participant,
            participant_2: participant,
            created: Date.now()
        };
        await data.set({
            table: 'story',
            key: storyKey,
            ...story
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

async function getStory(participant) {
    let record = await data.get({ table: 'participant', key: participant });
    if (record === null) {
        console.log('Not a story participant', participant);
        return false;
    }
    let story = await data.get({ table: 'story', key: record.storyKey });
    if (story === null) {
        console.log('No active story on', record.storyKey);
        return false;
    }
    console.log('Matched story with participants', story.participant_1, story.participant_2);
    return story;
}

async function leaveStory(participant) {
    let record = await data.get({ table: 'participant', key: participant });
    if (record === null) {
        console.log('Not a chat participant', participant);
        return false;
    }
    else {
        let story = await getStory(participant);
        await data.destroy({
            table: 'chat',
            key: record.storyKey
        });
        await data.destroy({
            table: 'participant',
            key: story.participant_1
        });
        await data.destroy({
            table: 'participant',
            key: story.participant_2
        });
        return true;
    }
}

module.exports = {
    pending: pendingStory,
    start: startStory,
    join: joinStory,
    get: getStory,
    leave: leaveStory
}