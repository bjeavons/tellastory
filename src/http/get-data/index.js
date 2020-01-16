// HTTP function
exports.handler = async function http(req) {
  return {
    headers: {
      'content-type': 'application/json',
    },
    body: process.env.NODE_ENV === 'production' ? '' : ''
  }
}
