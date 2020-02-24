'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  recipe: {
    type: String
  }
});

module.exports = mongoose.model('Comment', schema);
