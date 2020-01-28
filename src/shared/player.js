const twilio = require('@architect/shared/twilio');

async function message(content, address) {
    await twilio.sendMessage(content, address);
}

module.exports = {
    message: message
}