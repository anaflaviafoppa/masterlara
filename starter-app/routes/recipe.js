'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');

const RECIPE_API_ID = process.env.RECIPE_API_ID;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

const axios = require('axios');

router.get('/search', (req, res, next) => {
  const { item } = req.query;
  let recipes;
  const Recipe = axios.get(
    `https://api.edamam.com/search?q=${item}&app_id=${RECIPE_API_ID}&app_key=${RECIPE_API_KEY}`
  );
  Recipe.then(output => {
    recipes = output.data.hits;
    res.render('recipe/search', { recipes });
  }).catch(error => {
    next(error);
  });
});

module.exports = router;
