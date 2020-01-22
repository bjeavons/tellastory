let arc = require('@architect/functions');

exports.handler = async function http(req) {
  let body = arc.http.helpers.bodyParser(req);
  console.log(body);
  // @todo validate req auth

  if (!body.hasOwnProperty('story') || !body.hasOwnProperty('player')) {
    return {
      statusCode: 400,
      body: ''
    }
  }
  // @todo post story to game
  console.log('Naive bot makes story:', body.story + " and");
  return {
    statusCode: 200,
    body: ''
  }
}
