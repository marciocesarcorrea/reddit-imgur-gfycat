const routes = require('express').Router()

routes.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

module.exports = routes
