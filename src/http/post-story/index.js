let arc = require('@architect/functions');
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
  console.log(body);

  if (!body.hasOwnProperty('text') || !body.hasOwnProperty('player_id')) {
    return {
      statusCode: 400,
      body: ''
    }
  }
  // @todo play game
  console.log('Gameplay from web got:', body.text);
  return {
    statusCode: 200,
    body: ''
  }
}
