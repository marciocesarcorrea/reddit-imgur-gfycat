const mongoose = require('mongoose')

const LastUpdateSchema = new mongoose.Schema({
  submissionUrl: {
    type: String,
    required: true
  },
  submissionId: {
    type: String,
    required: true
  },
  subredditId: {
    type: String,
    required: true
  },
  isSubmissions: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('LastUpdate', LastUpdateSchema)
