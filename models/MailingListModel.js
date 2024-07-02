// models/MailingList.js
const mongoose = require('mongoose');
const validator = require('validator'); // Importing validator module

const mailingListSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: props => `${props.value} is not a valid email!`
    },
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});

const MailingList = mongoose.model('MailingList', mailingListSchema);

module.exports = MailingList;
