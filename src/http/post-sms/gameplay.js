const chats = require('@architect/shared/story');
const tokens = require('@architect/shared/token');
const twilio = require('@architect/shared/twilio');

async function game(payload) {
    const {sender, message} = twilio.parseMessage(payload);
    console.log('Message:', message, 'From:', sender);

    var response = {
        headers: {
            'content-type': 'text/xml',
        }
    };

    if (message.toLowerCase() === 'help') {
        response.body = twilio.twiml("Text an access keyword to join a story. Text 'stop' to end at any time. Msg&data rates may apply.");
    }
    else {
        response.body = twilio.twiml("Under construction 👨🏼‍🔧");
    }

    return response;
}

module.exports = game;