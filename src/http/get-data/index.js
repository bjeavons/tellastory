let data = require('@begin/data');

exports.handler = async function http(req) {
  let games = await data.get({
    table: 'game'
  });
  let players = await data.get({
    table: 'player'
  });

  let body = {
    games,
    players
  };

  return {
    headers: {
      'content-type': 'application/json',
    },
    body: process.env.NODE_ENV === 'production' ? '' : JSON.stringify(body)
  }
}
