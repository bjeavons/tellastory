let html = `
<!doctype html>
<html lang=en>
  <head>
    <meta charset=utf-8>
    <title>Tell a Story!</title>
    <link rel="stylesheet" href="https://static.begin.app/starter/default.css">
  </head>
  <body>
    <p class="center-text">
      Coming soon
    </p>
  </body>
</html>
`

exports.handler = async function http(req) {
  return {
    headers: {
      'content-type': 'text/html; charset=utf8'
    },
    body: html
  }
}
