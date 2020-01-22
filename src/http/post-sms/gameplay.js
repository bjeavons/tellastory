const gamecommand = require('./gamecommand.js');
const tokens = require('@architect/shared/token');
const storytime = require('@architect/shared/story');
const twilio = require('@architect/shared/twilio');

async function gameplay(payload) {
    const {sender, message} = twilio.parseMessage(payload);
    console.log('Message:', message, 'From:', sender);
    const command = new gamecommand.parse(message);

    var response = {
        headers: {
            'content-type': 'text/xml',
        }
    };

    let game = await storytime.get(sender);
    if (!game) {
        const isToken = tokens.includes(message.toLowerCase());
        game = await storytime.pending(message.toLowerCase());

        if (command.help) {
            response.body = twilio.twiml("🤖 This is storytime, text an access keyword to join a story in progress or start one. Text /intro to learn more. Text /stop to leave an in progress game or to end one you created. FYI msg&data rates may apply while playing");
        }
        else if (command.intro) {
            response.body = twilio.twiml("🤖 Storytime is a SMS-based storytelling game. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to!");
        }
        else if (isToken && game === null) {
            // If no pending game and message is a token then start one.
            await storytime.setup(sender, message.toLowerCase());
            response.body = twilio.twiml("🤖 Welcome to storytime! Once at least one more person joins you'll be collaboratively telling a story over SMS! Learn more about what's going to happen, text back /intro (with slash).");
        }
        else if (isToken && storytime.getCreator(game) !== sender) {
            game = await storytime.join(sender, message.toLowerCase());
            if (storytime.hasStarted(game)) {
                var relayedMessage = "🤖 Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players.";
                response.body = twilio.twiml("You've joined an in progress game! Text /intro (with slash) to learn what this is about or text /help for general game help.");
            }
            else {
                var relayedMessage = "🤖 Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players 👏 Start the game at any time by texting /start/ or text /help for help.";
                response.body = twilio.twiml("You've joined a pending game. The game creator will start it once they're ready! Text /intro (with slash) to learn what will happen next or text /help for general game help.");
            }
            await twilio.sendMessage(relayedMessage, storytime.getCreator(game));
        }
        else {
            console.log("No story in progress");
            response.body = twilio.twiml("🤖 This is storytime, text an access keyword to join a story in progress or start one. Text /intro to learn more.");
        }
    }
    else if (command.stop) {
        if (storytime.getCreator(game) === sender) {
            await storytime.end(sender);
            response.body = twilio.twiml("🤖 OK, you've ended the game. Thanks for playing 👋");
        }
        else {
            game = await storytime.leave(sender);
            if (game) {
                response.body = twilio.twiml("🤖 OK, you've left the story. Thanks for playing 👋");
            }
        }
    }
    else {
        if (command.intro) {
            response.body = twilio.twiml("🤖 This is a SMS-based storytelling game. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to.");
        }
        else if (command.help) { 
            response.body = twilio.twiml("🤖 Game control commands start with slash (/). Text /stop to leave an in progress game or to end one you created. Text /intro to learn how this works. FYI msg&data rates may apply while playing.");
        }
        else if (command.start && storytime.getCreator(game) === sender) {
            console.log("Starting game!");
            await storytime.start(game);
            let receiver = storytime.getNextPlayer(game, sender);
            await twilio.sendMessage("🤖 And so it begins! Get the story started, text back one or two words to begin a sentence.", receiver);
            response.body = twilio.twiml("🤖 The first player has been asked to start the story!");
        }
        else if (!storytime.hasStarted(game) && storytime.getCreator(game) === sender) {
            let playerCount = storytime.getPlayerCount(game);
            response.body = twilio.twiml("🤖 The game is ready with " + playerCount + " players, get some more people to join or start the game by texting /start! Text /help for help.");
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

    return response;
}

module.exports = gameplay;