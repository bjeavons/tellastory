const tokens = require('@architect/shared/gametoken');
const storytime = require('@architect/shared/story');
const gameplayer = require('@architect/shared/player');
const storyteller = require('@architect/shared/storyteller');

async function gamerouter(sender, channel, command, message) {
    var response = {};

    let player = await gameplayer.get(sender, channel);
    if (!player || gameplayer.isInactive(player)) {
        response.body = await intro(sender, channel, command, message);
    }
    else if (gameplayer.inDemoGame(player)) {
        response.body = await demo(player, command, message);
    }
    else if (gameplayer.inPendingGame(player)) {
        response.body = await pregame(player, command, message);
    }
    else if (gameplayer.inActiveGame(player)) {
        let body = await gameplay(player, command, message);
        if (body !== '') {
            response.body = body;
        }
    }

    return response;
}

async function intro(sender, channel, command, message) {
    const isToken = tokens.includes(message.toLowerCase());

    let response = "b: This is Storytime, a collaborative short storytelling game over SMS. Text /intro (with slash) to learn more. Text a game token if you have one or /token to learn about them.";

    if (command.intro) {
        response = "b: You and your friends tell a short story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to! Text /help for help at any time or for a sample story between you and me text /demo";
    }
    else if (command.help) {
        response = "b: This is Storytime. Text a game token to start a short story or join an in-progress one. Text /token to learn about game tokens. Text /end to leave or end a game. Text /intro to learn about Storytime. FYI msg&data rates may apply.";
    }
    else if (command.token) {
        response = "b: Game tokens are single words that group together people in storytelling. The first person to text a game token unlocks the ability to start and stop the story. Then anyone else who texts that same token joins the game. Try it now, text back the word 'begin' (without quotes).";
    }
    else if (message.trim().toLowerCase() === 'begin') {
        response = "b: Well done! If that were a real game token I'd have set you up with the ability to start and stop a storytelling session that others could join. While Storytime is in development, Ben has control of all the game tokens so contact him for one! Text /demo for a demo story with me.";
    }
    else if (command.demo) {
        // Start demo game.
        let player_id = await gameplayer.create(sender, channel, 'demo_game'); // @todo make const
        let story = 'The';
        await storytime.demo(player_id, story);
        response = "b: OK, fair warning, I'm not a great storyteller, but let's you and I try it! I'll text the start of a story and you text back to continue. Ending punctuation will complete our story or you can end it by texting just /end. Here goes ... " + story;
    }
    else if (isToken) {
        let game = await storytime.pending(message.toLowerCase());

        if (!game) {
            // No game yet so set it up on token.
            let player_id = await gameplayer.create(sender, channel, 'pending_game'); // @todo make const
            await storytime.setup(player_id, message.toLowerCase());
            response = "b: Welcome to Storytime! Once at least one more person joins you can start telling a short story together over texts to this number. Learn more about what's going to happen, text back /intro (with slash).";
        }
        else if (!storytime.hasStarted(game)) {
            let player_id = await gameplayer.create(sender, channel, 'pending_game'); // @todo make const
            game = await storytime.join(player_id, message.toLowerCase());
            var relayedMessage = "b: Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players. Start the game at any time by texting /start or text /help for help.";
            response = "b: Welcome to Storytime! You've joined a pending game. The game creator will start it once they're ready. Text /intro (with slash) to learn what will happen next or text /help for help at any time.";
            await gameplayer.message(relayedMessage, storytime.getCreator(game));
        }
        else {
            let player_id = await gameplayer.create(sender, channel, 'active_game'); // @todo make const
            game = await storytime.join(player_id, message.toLowerCase());
            var relayedMessage = "b: Someone joined the game! Now at " + storytime.getPlayerCount(game) + " total players.";
            response = "b: Welcome to Storytime! You've joined an ongoing game. Text /intro (with slash) to learn what this is about or text /help for help at any time.";
            await gameplayer.message(relayedMessage, storytime.getCreator(game));
        }
    }

    return response;
}

function hasSentencedEnded(story, message) {
    const puncMarks = ['.', '?', '!'];
    return puncMarks.includes(message.trim()[message.length - 1]);
}

async function demo(player, command, message) {
    if (!command.stop && command.isCommand) {
        return "b: You're currently in a demo game. Text /end to end it or it'll expire in about 24 hours. FYI msg&data rates may apply.";
    }
    message = message.trim().toLowerCase();

    const demoStory = await storytime.getDemoStory(player.key);
    if (!demoStory) {
        await gameplayer.deactivate(player.key);
        return "b: Get some friends together with a game token and start telling a short story! Text /token to learn more";
    }
    if (command.stop) {
        await storytime.endDemo(player.key);
        await gameplayer.deactivate(player.key);
        return "b: I know, I'm not a great storyteller :/ Get some friends together with a game token and start telling a short story! Text /token to learn more.";
    }

    if (hasSentencedEnded(demoStory, message)) {
        // End the demo on sentence completion.
        await storytime.endDemo(player.key);
        await gameplayer.deactivate(player.key);
        return "b: OK, the end. That was fun! Get some friends together with a game token and start telling a short story. Text /token to learn more.";
    }

    let next = 'and';
    try {
        next = await storyteller.nextWord(message);
    }
    catch (err) {
        console.log(err);
    }
    const story = demoStory + " " + message + " " + next;
    await storytime.updateDemo(player.key, story);
    return story;
}

async function pregame(player, command, message) {
    let response = '';
    const game = await storytime.get(player.key);

    if (command.help && !storytime.isCreator(game, player.key)) {
        response = "b: You're currently a player in a game waiting to start. Text /stop to leave it now (or at any time) otherwise hang tight for the game creator to get it started! Text /intro to learn what's going to happen. FYI msg&data rates may apply.";
    }
    else if (command.intro && !storytime.isCreator(game, player.key)) {
        response = "b: This is Storytime, a collaborative storytelling game over SMS. You and your friends tell a short story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to! Text /stop to leave the game at any time. Text /help for help.";
    }
    else if (command.intro && storytime.isCreator(game, player.key)) {
        response = "When you start the story I'll ask you to reply with one or two words that I'll send to another player. What they respond with is added to your words and sent together to the next player, and so the story continues! For now, short stories are best :) End the game at any time by texting just /end.";
    }
    else if (command.start && storytime.isCreator(game, player.key)) {
        console.log("Starting game!");
        await storytime.start(game);
        response = "b: And so it begins! Get the story started, text back one or two words to begin a sentence that I'll send to the next player. Text just /end to end the game at any time.";
    }
    else if (command.stop && !storytime.isCreator(game, player.key)) {
        response = "b: Leaving so soon? OK, no problem. Text back the game token to rejoin.";
        await storytime.leave(player.key);
        // @todo inform creator?
    }
    else if (command.stop && storytime.isCreator(game, player.key)) {
        response = "b: Ending before it begins? OK, no problem. Text back the game token to restart.";
        await storytime.end(player.key);
    }
    else if (storytime.isCreator(game, player.key)) {
        let playerCount = storytime.getPlayerCount(game);
        if (playerCount === 1) {
            response = "b: There are no other players yet. Get some people to join by asking them to text the token to this number! When at least one more person joins you can start the game by texting /start.";
        }
        else {
            response = "b: The game is ready with " + playerCount + " players, get some more people to join by asking them to text the token to this number! When you're ready you can start the game by texting /start.";
        }
        response += " Text /end to end the game at any time. FYI msg&data rates may apply.";
    }
    else {
        console.log("Message ignored, game hasn't started.");
        response = "b: Hi there, thanks for your message, I'm waiting for the game creator to let me get the storytelling game started. Hang tight! Text /help for help.";
    }

    return response;
}

async function gameplay(player, command, message) {
    let response = '';
    const game = await storytime.get(player.key);

    if (command.stop && storytime.isCreator(game, player.key)) {
        await storytime.end(player.key);
        response = "b: OK, you've ended the game. Thanks for playing!";
    }
    else if (command.stop) {
        await storytime.leave(player.key);
        response = "b: OK, you've left the story. Thanks for playing!";
    }
    else if (command.intro) {
        response = "b: This is a SMS-based storytelling game. You and your friends tell a short story, one or two words at a time, by text messages to this number. When someone texts the next part of the story the whole story gets sent to another player to add on to.";
    }
    else if (command.help) { 
        response = "b: Game control commands start with slash (/). Text /end to leave an in progress game or to end one you created. Text /intro to learn how this works. FYI msg&data rates may apply while playing.";
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