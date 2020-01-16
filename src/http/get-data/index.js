let data = require('@begin/data');

exports.handler = async function http(req) {
  let story = await data.get({
    table: 'story'
  });
  let participants = await data.get({
    table: 'participant'
  });
  let pending = await data.get({
    table: 'pending'
  });

  let body = {
    pending: pending,
    participants: participants,
    stories: story
  };

  return {
    headers: {
      'content-type': 'application/json',
    },
    body: process.env.NODE_ENV === 'production' ? '' : JSON.stringify(body)
  }
}
