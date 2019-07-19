const mogoose = require('mongoose')
const mongoConnection = mogoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useFindAndModify: true
})
module.exports = {
  mongoConnection
}
