const tokens = require('@architect/shared/gametoken');
const storytime = require('@architect/shared/story');
const gameplayer = require('@architect/shared/player');

async function gamerouter(sender, channel, command, message) {
    var response = {};

    let player = await gameplayer.get(sender, channel);
    if (!player) {
        response.body = await intro(sender, channel, command, message);
    }
    else if (gameplayer.inDemoGame(player)) {
        response.body = await demo(player, command, message);
    }
    else if (gameplayer.inPendingGame(player)) {
        response.body = await pregame(player, command, message);
    }
    else if (gameplayer.inActiveGame(player)) {
        response.body = await gameplay(player, command, message);
    }

    return response;
}

async function intro(sender, channel, command, message) {
    let response = '';
    const isToken = tokens.includes(message.toLowerCase());

    if (command.help) {
        response = "🤖 This is Storytime. If you have a game token text it to start a story or join an in-progress one. Text /intro to learn more. Text /end to leave or end a game. FYI msg&data rates may apply.";
    }
    else if (command.intro) {
        response = "🤖 Storytime is a story-telling game over SMS. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to! Text /help for more info. Text /demo for a short demo game.";
    }
    else if (command.demo) {
        // Start demo game.
        let player_id = await gameplayer.create(sender, channel, 'demo_game'); // @todo make const
        response = 'Once upon a time';
        await storytime.demo(player_id, response);
        await gameplayer.message("🤖 OK, let's tell a story, you and I! I'll text you the start of a story and you text back to add on. Get ready!", player_id);
    }
    else if (isToken) {
        let game = await storytime.pending(message.toLowerCase());

        if (!game) {
            // No game yet so set it up on token.
            let player_id = await gameplayer.create(sender, channel, 'pending_game'); // @todo make const
            await storytime.setup(player_id, message.toLowerCase());
            response = "🤖 Welcome to Storytime! Once at least one more person joins you'll be collaboratively telling a story over SMS! Learn more about what's going to happen, text back /intro (with slash).";
        }
        else if (!storytime.hasStarted(game)) {
            let player_id = await gameplayer.create(sender, channel, 'pending_game'); // @todo make const
            game = await storytime.join(player_id, message.toLowerCase());
            var relayedMessage = "🤖 Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players 👏 Start the game at any time by texting /start or text /help for help.";
            response = "You've joined a pending game. The game creator will start it once they're ready! Text /intro (with slash) to learn what will happen next or text /help for general game help.";
            await gameplayer.message(relayedMessage, storytime.getCreator(game));
        }
        else {
            let player_id = await gameplayer.create(sender, channel, 'active_game'); // @todo make const
            game = await storytime.join(player_id, message.toLowerCase());
            var relayedMessage = "🤖 Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players.";
            response = "You've joined an ongoing game! Text /intro (with slash) to learn what this is about or text /help for general game help.";
            await gameplayer.message(relayedMessage, storytime.getCreator(game));
        }
    }
    else {
        console.log("No story in progress");
        response = "🤖 This is Storytime! If you have a game token text it to start a story or join an in-progress one. Text /intro to learn more.";
    }

    return response;
}

function hasSentencedEnded(story, message) {
    const puncMarks = ['.', '?', '!'];
    return puncMarks.includes(message.trim()[message.length - 1]);
}

async function demo(player, command, message) {
    if (command.help) {
        return "🤖 You're currently in a demo game. Text /end to end it or it'll expire in about 24 hours. FYI msg&data rates may apply.";
    }
    if (command.intro) {
        return "🤖 Storytime is a story-telling game over SMS. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to! Text /help for more info.";
    }

    const demoStory = await storytime.getDemoStory(player.key);
    if (!demoStory) {
        await gameplayer.deactivate(player.key);
        return "🤖 Get a full game going!";
    }
    if (command.stop) {
        await storytime.endDemo(player.key);
        await gameplayer.deactivate(player.key);
        return "🤖 I know, I'm not a great story-teller :/ Get some friends together with a game token and start telling a story! ";
    }

    let next = "and";
    if (hasSentencedEnded(demoStory, message)) {
        next = "Then";
    }
    let story = demoStory + " " + message + " " + next;
    await storytime.updateDemo(player.key, story);
    if (hasSentencedEnded(demoStory, message)) {
        story = next;
    }
    return story;
}

async function pregame(player, command, message) {
    let response = '';
    const game = await storytime.get(player.key);

    if (command.help) {
        response = "🤖 You're currently a player in a game waiting to start. Text /end to leave it now (and at any time) or hang tight for the game creator to get it started! FYI msg&data rates may apply.";
    }
    else if (command.intro && !storytime.isCreator(game, player.key)) {
        response = "🤖 This is Storytime, a collaborative story-telling game over SMS. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to! Text /end to leave the game at any time. Text /help for help.";
    }
    else if (command.start && storytime.isCreator(game, player.key)) {
        console.log("Starting game!");
        await storytime.start(game);
        let receiver_id = storytime.getNextPlayer(game, player.key);
        await gameplayer.message("🤖 And so it begins! Get the story started, text back one or two words to begin a sentence.", receiver_id);
        response = "🤖 A player has been asked to start the story.";
    }
    else if (!storytime.hasStarted(game) && storytime.isCreator(game, player.key)) {
        let playerCount = storytime.getPlayerCount(game);
        if (playerCount === 1) {
            response = "🤖 There are no other players yet. Get some people to join!";
        }
        else {
            response = "🤖 The game is ready with " + playerCount + " players, get some more people to join or start the game by texting /start!";
        }
        response += " Text /end to end the game at any time. Text /help for help.";
    }
    else if (!storytime.hasStarted(game)) {
        console.log("Message ignored, game hasn't started.");
        response = "🤖 Hi there, thanks for your message, I'm waiting for the game creator to let me get the story telling game started. Hang tight! Text /help for help.";
    }

    return response;
}

async function gameplay(player, command, message) {
    let response = '';
    const game = await storytime.get(player.key);

    if (command.stop && storytime.isCreator(game, player.key)) {
        await storytime.end(player.key);
        response = "🤖 OK, you've ended the game. Thanks for playing 👋";
    }
    else if (command.stop) {
        await storytime.leave(player.key);
        response = "🤖 OK, you've left the story. Thanks for playing 👋";
    }
    else if (command.intro) {
        response = "🤖 This is a SMS-based storytelling game. You and your friends tell a story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to.";
    }
    else if (command.help) { 
        response = "🤖 Game control commands start with slash (/). Text /end to leave an in progress game or to end one you created. Text /intro to learn how this works. FYI msg&data rates may apply while playing.";
    }
    else {
        /**
         * @todo sentences!
         *  ? lowercase so long as not propernoun
         *  ? handle sentence completions - allow for multi sentence stories
         */
        let story = storytime.getStory(game);
        if (story === null) {
            console.log('Opening move!');
            story = message;
        }
        else {
            story = story + " " + message;
        }
        await storytime.updateStory(game, story);

        let receiver_id = storytime.getNextPlayer(game, player.key);

        console.log("Relay story to", receiver_id);
        await gameplayer.message(story, receiver_id);
    }
    return response;
}

module.exports = gamerouter;