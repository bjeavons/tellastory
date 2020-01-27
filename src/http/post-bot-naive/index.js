let arc = require('@architect/functions');
const rp = require('request-promise-native');
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

  let body = arc.http.helpers.bodyParser(req);

  if (!body.hasOwnProperty('story') || !body.hasOwnProperty('player_id')) {
    return {
      statusCode: 400,
      body: ''
    }
  }
  let text = "and";
  console.log('Naive bot makes story:', body.story + " " + text);
  await rp({
    url: process.env.APP_URL + '/story',
    method: 'POST',
    auth: { bearer: process.env.APP_STORY_JWT },
    json: true,
    body: {
      text: text,
      player_id: body.player_id
    }
  })
  .catch(function (err) {
    console.log('Story post error:', err);
  });
  return {
    statusCode: 200,
    body: ''
  }
}
