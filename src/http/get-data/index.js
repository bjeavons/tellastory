const data = require('@begin/data');
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

  const tables = [
    'demo',
    'game',
    'gameplayer',
    'archive_game',
    'player',
    'player_sms'
  ];
  const getData = async () => {
    return Promise.all(tables.map(async function (t) {
      return await data.get({table: t});
    }));
  }
  const body = await getData();

  return {
    headers: {
      'content-type': 'application/json',
    },
    body: process.env.NODE_ENV === 'production' ? '' : JSON.stringify(body)
  }
}
