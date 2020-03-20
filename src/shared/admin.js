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

async function admin(sender, message) {
    if (message === 'GETTOKEN') {
        return auth.getToken({sender: sender});
    }
    else if (message === 'HARDRESETPLS') {
        await complete_reset_clear_all_data();
        return 'OK, since you asked nicely. Done.';
    }
    throw new Error('No operation');
}

module.exports = admin;