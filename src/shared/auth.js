var jwt = require('jsonwebtoken');

function verify(req) {
    var authorization = req.headers['authorization'];
    if (!authorization || !authorization.toLowerCase().startsWith('bearer')) throw new Error('No token provided.');

    try {
        jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
        return true;
    }
    catch (err) {
        throw new Error('Failed to authenticate.');
    }
}

function getToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, {
        expiresIn: 86400 // expires in 24 hours
    });
}

module.exports = {
    verify: verify,
    getToken: getToken
}