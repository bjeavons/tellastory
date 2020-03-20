const twilio = require('@architect/shared/twilio');
const data = require('@begin/data');
const uniqueString = require('unique-string');

async function getByAddress(address, channel) {
    // @todo support web channel
    let table = 'player_sms';
    let record = await data.get({ table: table, key: address });
    if (record === null) {
        return false;
    }
    return await data.get({ table: 'player', key: record.player_id });
}

function inPendingGame(player) {
    return player.state === 'pending_game';
}

function inDemoGame(player) {
    return player.state === 'demo_game';
}

function inActiveGame(player) {
    return player.state === 'active_game';
}

async function create(address, channel, state) {
    // @todo support web channel
    let table = 'player_sms';
    let player_id = uniqueString();
    await data.set({
        table: table,
        key: address,
        player_id: player_id,
        created: Date.now()
    });
    await data.set({
        table: 'player',
        key: player_id,
        address: address,
        created: Date.now(),
        channel: 'SMS', // @todo support other channels
        state: state
    });
    return player_id;
}

async function activate(player_id) {
    let player = await data.get({ table: 'player', key: player_id });
    player.state = 'active_game';
    await data.set({
        table: 'player',
        key: player.key,
        ...player
    });
}

async function deactivate(player_id) {
    let player = await data.get({ table: 'player', key: player_id });
    if (!player) {
        return;
    }
    // @todo keep record of past games?
    await data.destroy({
        table: 'player',
        key: player_id
    });
    await data.destroy({
        table: 'player_sms',
        key: player.address
    });
}

async function message(content, player_id) {
    // @todo support other channels
    let record = await data.get({ table: 'player', key: player_id });
    if (record === null) {
        throw new Error('No player found for ID', player_id);
    }
    await twilio.sendMessage(content, record.address);
}

module.exports = {
    get: getByAddress,
    inPendingGame: inPendingGame,
    inDemoGame: inDemoGame,
    inActiveGame: inActiveGame,
    create: create,
    activate: activate,
    deactivate: deactivate,
    message: message
}