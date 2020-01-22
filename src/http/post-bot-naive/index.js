let arc = require('@architect/functions');
const rp = require('request-promise-native');

exports.handler = async function http(req) {
  let body = arc.http.helpers.bodyParser(req);
  console.log(body);
  // @todo validate req auth

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
    json: true,
    body: {
      text: text,
      player_id: body.player_id
    }
  })
  .then(function (body) {
    console.log('post text resp:', body);
  })
  .catch(function (err) {
    console.log('post text err:', err);
  });
  return {
    statusCode: 200,
    body: ''
  }
}
