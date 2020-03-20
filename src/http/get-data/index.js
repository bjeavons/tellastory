let data = require('@begin/data');
const auth = require('@architect/shared/auth');

exports.handler = async function http(req) {
  try {
    auth.verify(req);
  }
  catch (err) {
    return {
      statusCode: 401,
      body: err.message
    };
  }

  let demos = await data.get({
    table: 'demo'
  });
  let games = await data.get({
    table: 'game'
  });
  let players = await data.get({
    table: 'player'
  });

  let body = {
    demos,
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
