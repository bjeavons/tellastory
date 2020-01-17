const storytime = require('@architect/shared/story');
const tokens = require('@architect/shared/token');
const twilio = require('@architect/shared/twilio');

async function gameplay(payload) {
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
        let game = await storytime.get(sender);
        if (!game) {
            game = await storytime.pending(message.toLowerCase());
            if (tokens.includes(message.toLowerCase()) && game === null) {
                // If no pending game and message is a token then start one.
                await storytime.setup(sender, message.toLowerCase());
                response.body = twilio.twiml("Yay! Waiting for at least one more to join the game upon which you can start it by texting 'start'. Text 'help' for help or 'stop' to end the game. Msg&data rates may apply.");
            }
            else if (tokens.includes(message.toLowerCase()) && storytime.getCreator(game) !== sender) {
                game = await storytime.join(sender, message.toLowerCase());
                if (storytime.hasStarted(game)) {
                    var relayedMessage = "Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players.";
                    response.body = twilio.twiml("You've joined an in progress game! Text 'help' for help or 'stop' to leave at any time. Msg&data rates may apply.");
                }
                else {
                    var relayedMessage = "Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players 👏 Start the game at any time by texting 'start' or text 'help' for help.";
                    response.body = twilio.twiml("You've joined a pending game. The game creator will start it once ready! Text 'help' for help or 'stop' to leave the game. Msg&data rates may apply.");
                }
                await twilio.sendMessage(relayedMessage, storytime.getCreator(game));
            }
            else {
                console.log("No story in progress");
                response.body = twilio.twiml("No story in progress 🥺");
            }
        }
        else if (message.toLowerCase() === "stop") {
            if (storytime.getCreator(game) === sender) {
                await storytime.end(sender);
                response.body = twilio.twiml("You've ended the game. 👋");
            }
            else {
                game = await storytime.leave(sender);
                if (game) {
                    response.body = twilio.twiml("You've left the story. 👋");
                }
            }
        }
        else {
            if (message.toLowerCase() === 'start' && storytime.getCreator(game) === sender) {
                console.log("Starting game!");
                await storytime.start(game);
                let receiver = storytime.getNextPlayer(game, sender);
                await twilio.sendMessage("👉", receiver);
                response.body = twilio.twiml("🙌");
            }
            else if (!storytime.hasStarted(game) && storytime.getCreator(game) === sender) {
                let playerCount = storytime.getPlayerCount(game);
                response.body = twilio.twiml("The game is ready with " + playerCount + " players, get some more people to join or start the game by texting 'start'!");
            }
            else if (!storytime.hasStarted(game) && storytime.getCreator(game) !== sender) {
                console.log("Message ignored, game hasn't started.");
            }
            else {
                /**
                 * @todo sentences!
                 *  ? lowercase so long as not propernoun
                 *  ? handle sentence completions - allow for multi sentence stories
                 */
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
                await twilio.sendMessage(story, receiver);
            }
        }
    }

    return response;
}

module.exports = gameplay;