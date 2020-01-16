let html = `
<!doctype html>
<html lang=en>
  <head>
    <meta charset=utf-8>
    <title>Tell a Story</title>
  </head>
  <body>
    <h1 class="center-text">
      Coming soon!
    </h1>
  </body>
</html>
`

// HTTP function
exports.handler = async function http(req) {
  return {
    headers: {
      'content-type': 'text/html; charset=utf8'
    },
    body: html
  }
}
