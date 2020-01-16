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
        const game = await storytime.get(sender);
        if (!game) {
            // If no pending story game then start one.
            const pendingGame = await storytime.pending(message.toLowerCase());
            if (tokens.includes(message.toLowerCase()) && pendingGame === null) {
                await storytime.start(sender, message.toLowerCase());
                response.body = twilio.twiml("Got ya, waiting for at least one more to join. Text 'help' for help or 'stop' to leave the game. Msg&data rates may apply.");
            }
            else if (tokens.includes(message.toLowerCase()) && pendingGame !== sender) {
                await storytime.join(sender, message.toLowerCase());
                response.body = twilio.twiml("You've joined the story game! Text 'help' for help or 'stop' to leave. Msg&data rates may apply.");
            }
            else if (pendingGame === sender) {
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
        else if (game) {
            let story = storytime.getStory(game);
            if (story !== null ) {
                story = story + " " + message;
            }
            else {
                console.log('Opening move!');
                story = message;
            }
            await storytime.updateStory(game, story);

            let receiver = storytime.getNextPlayer(game, sender);

            console.log("Relay story to", receiver);
            if (process.env.NODE_ENV === 'production') {
                try {
                    const relayedMessage = await twilio.sendMessage(story, receiver);
                    console.log('Relayed story SID', relayedMessage.sid);
                }
                catch (e) {
                    console.log('ERROR:', e);
                }
            }
            else {
                console.log(story);
            }
        }
    }

    return response;
}

module.exports = game;