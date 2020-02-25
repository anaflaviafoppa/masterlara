'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String
  },
<<<<<<< HEAD
  recipeSearch:{
    type: [String]
  },
  picture: { type: String }
=======
  picture: {
    type: String
  }
>>>>>>> 201140e25fd4c0e845fbf8ce7fd9c402ec95ed14
});

module.exports = mongoose.model('User', schema);
