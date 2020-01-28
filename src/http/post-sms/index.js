let arc = require('@architect/functions');
let twilio = require('@architect/shared/twilio');
let game = require('@architect/shared/gameplay');

exports.handler = async function http(req) {
  if ((process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging') && !twilio.validateRequest(req)) {
    return {
      statusCode: 401,
      body: 'Unauthorized'
    }
  }

  console.log(Date());
  const {sender, message} = twilio.parseMessage(arc.http.helpers.bodyParser(req));
  console.log('Message:', message, 'From:', sender);
  try {
    response = await game(sender, message);
    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/xml'
      },
      body: 'body' in response ? twilio.twiml(response.body).toString() : ''
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
