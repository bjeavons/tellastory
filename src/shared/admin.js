const auth = require('@architect/shared/auth');

function admin(sender, message) {
    if (message === 'GETTOKEN') {
        return auth.getToken({sender: sender});
    }
    throw new Error('No operation');
}

module.exports = admin;