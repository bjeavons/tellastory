const storytime = require('@architect/shared/story');
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
        const story = await storytime.get(sender);
        if (!story) {
            // If no pending story game then start one.
            const pendingStory = await storytime.pending(message.toLowerCase());
            if (tokens.includes(message.toLowerCase()) && pendingStory === null) {
                await storytime.start(sender, message.toLowerCase());
                response.body = twilio.twiml("Got ya, waiting for at least one more to join. Text 'help' for help or 'stop' to leave the game. Msg&data rates may apply.");
            }
            else if (tokens.includes(message.toLowerCase()) && pendingStory !== sender) {
                await storytime.join(sender, message.toLowerCase());
                response.body = twilio.twiml("You've joined the story game! Text 'help' for help or 'stop' to leave. Msg&data rates may apply.");
            }
            else if (pendingStory === sender) {
                console.log("Cannot rejoin game");
                response.body = twilio.twiml("Get a friend to join this game!");
            }
            else {
                console.log("No story in progress");
                response.body = twilio.twiml("No story in progress 🥺");
            }
        }
        else if (message.toLowerCase() === "stop") {
            await storytime.leave(sender);
            response.body = twilio.twiml("You've left the story. 👋");
        }
        else if (story) {
            console.log("STORY TELLING MECHANICS");
        }
    }

    return response;
}

module.exports = game;