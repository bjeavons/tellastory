const auth = require('@architect/shared/auth');
const data = require('@begin/data');

async function complete_reset_clear_all_data() {
    const tables = [
        'demo',
        'game',
        'gameplayer',
        'player',
        'player_sms'
    ];
    tables.map(async function (t) {
        let records = await data.get({ table: t });
        records.map( async function(r) {
            await data.destroy({
                table: t,
                key: r.key
            });
        });
        console.log("Destroyed", records.length, t, "records");
    });
}

async function stats() {
    const games = await data.get({ table: 'game' });
    let active_games = 0;
    let pending_games = 0;
    games.forEach( function(g) {
        if (g.table === 'game' && g.started) {
            active_games += 1;
        }
        else if (g.table === 'game') {
            pending_games += 1;
        }
    });
    let players = await data.get({ table: 'player' });
    players = players.filter(function(p) {
        return p.table === 'player';
    });
    return "Games - active:" + active_games + ", pending:" + pending_games + " Players - total:" + players.length;
}

async function admin(sender, message) {
    if (message === 'GETJWT') {
        return auth.getToken({sender: sender});
    }
    else if (message === 'STATS') {
        return await stats();
    }
    else if (message === 'HARDRESETPLS') {
        await complete_reset_clear_all_data();
        return 'OK, since you asked nicely. Done.';
    }
    throw new Error('No operation');
}

module.exports = admin;