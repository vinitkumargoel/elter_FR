var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ChatSchema = new Schema({
  receiverid: {
    type: String,
    required: true
  },
  senderid: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false,
  },
  seen:{
    type: String,
    required: false,
  },
  sender_token: {
    type: String,
    required: false,
  },
  receiver_token:{
    type: String,
    required: false,
  },
  voice:{
    type: String,
    required: false,
  },
  pic:{
    type: String,
    required: false,
  },
  message_type:{
    type: String,
    required: false,
  },
  updated:{
    type: Date,
    default: Date.now()
  },
  content_type:{
    type: Boolean,
    default: false
  }

},{
  collection: 'chat'
});


module.exports = mongoose.model('Chat', ChatSchema );
