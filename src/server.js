require('dotenv').config()
const app = require('express')()
const http = require('http').createServer(app)

require('./database')
// require('./jobs')
const socket = require('./socket')
const routes = require('./routes')

app.use(routes)

http.listen(process.env.PORT, function () {
  console.log(`listening on *:${process.env.PORT}`)
})
socket.init(http)
module.exports = {
  app,
  http
}
