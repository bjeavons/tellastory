exports.handler = async function http(req) {
  console.log(req)
  return {
    status: 302,
    location: '/'
  }
}
