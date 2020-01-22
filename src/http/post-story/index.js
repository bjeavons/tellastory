let arc = require('@architect/functions');

exports.handler = async function http(req) {
  let body = arc.http.helpers.bodyParser(req);
  console.log(body);
  // @todo validate req auth

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
