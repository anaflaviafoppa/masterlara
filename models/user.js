'use strict';

const mongoose = require('mongoose');

const favoriteRecipes = new mongoose.Schema({
  name:{
    type: String
  },
  id:{
    type:String
  },
  image:{
    type:String
  }
});



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
  recipeSearch:{
    type: [String]
  },
  picture: { type: String },
  favoriteRecipes: [favoriteRecipes]
});

module.exports = mongoose.model('User', schema);
