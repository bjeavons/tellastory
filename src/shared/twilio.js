const twilio = require('twilio');
let arc = require('@architect/functions');

function validateRequest(req) {
    return twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        req.headers['X-Twilio-Signature'],
        process.env.TWILIO_URL,
        arc.http.helpers.bodyParser(req)
    );
}

function parseMessage(data) {
    return {
        sender: data.From.replace(/[^\d.-]/g, ""),
        message: data.Body
    }
}

function twiml(body) {
    const twiml = new twilio.twiml.MessagingResponse();
    return twiml.message(body);
}

async function sendMessage(message, to) {
    if (process.env.NODE_ENV === 'production') {
        try {
            const client = new twilio.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const relayedMessage = await client.messages.create({
                body: message,
                from: process.env.TWILIO_SENDER,
                to: to
            });
            console.log('Relayed message SID', relayedMessage.sid);
        }
        catch (e) {
            console.log('ERROR:', e);
        }
    }
    else {
        console.log("Would relay:", message);
    }
}

module.exports = {
    validateRequest: validateRequest,
    parseMessage: parseMessage,
    twiml: twiml,
    sendMessage: sendMessage
}