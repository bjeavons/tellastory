let arc = require('@architect/functions');
let twilio = require('@architect/shared/twilio');
let game = require('./gameplay.js');

exports.handler = async function http(req) {
  if ((process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging') && !twilio.validateRequest(req)) {
    return {
      statusCode: 401,
      body: 'Unauthorized'
    }
  }

  console.log(Date());
  try {
    response = await game(arc.http.helpers.bodyParser(req));
    return {
      statusCode: 200,
      headers: response.headers,
      body: 'body' in response ? response.body.toString() : ''
    }
  }
  catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: 'Internal server error'
    }
  }
}
