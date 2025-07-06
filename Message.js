const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCred',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCred',
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  image:{
    type: String,
     required: false,
  },
  seen: { type: Boolean, default: false },
  delivered: { type: Boolean, default: true }, 
});

mongoose.model('Message', messageSchema);