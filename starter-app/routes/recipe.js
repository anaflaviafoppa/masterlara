'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');
const Comment = require('./../models/comment');

const RECIPE_API_ID = process.env.RECIPE_API_ID;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

const axios = require('axios');

router.get('/search', (req, res, next) => {
  //Params to request the API
  const params = {
    q: req.query.item,
    app_id: RECIPE_API_ID,
    app_key: RECIPE_API_KEY,
    health: req.query.health
  };

  let recipes;

  // Activate API > send request
  const Recipe = axios.get(`https://api.edamam.com/search`, { params });

  Recipe.then(output => {
    recipes = output.data.hits;
    //SPLIT BY SPACE:
    let ingredientsArray = params.q.split(' ');


    const percentageSort = (a, b) => {
      if (a.percentage > b.percentage) {
        return 1;
      }

      if (a.percentage < b.percentage) {
        return -1;
      }
      // a must be equal to b
      return 0;
    }

    //VERIFICAR a quantidade de ingredientes que temos/ingredientes
    for (let recipe of recipes) {
      ingredientsArray = params.q.split(' ');
      let counter = 0;
      let recipeArray = recipe.recipe.ingredientLines;

      for (let i = 0; i < recipeArray.length; i++) {
        for (let j = 0; j < ingredientsArray.length; j++) {
          var incluido = recipeArray[i].includes(ingredientsArray[j]);
          if (incluido) {
            counter++;
            ingredientsArray.splice(j, 1);
            console.log(ingredientsArray);
          }
        }
        recipe.percentage = ((counter / recipeArray.length) * 100).toFixed(0);
      }
    }

    console.log('PERCENTAGE '+ typeof recipes[0].percentage);

    recipes.sort(function (a, b) {
      if (parseInt(a.percentage) < parseInt(b.percentage)) {
        return 1;
      }
      if (parseInt(a.percentage) > parseInt(b.percentage)) {
        return -1;
      }
      // a must be equal to b
      return 0;
    })

    

    res.render('recipe/search', { recipes });
  }).catch(error => {
    next(error);
  });
});

router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  let recipe;
  const Recipe = axios.get(
    `https://api.edamam.com/search?r=http%3A%2F%2Fwww.edamam.com%2Fontologies%2Fedamam.owl%23recipe_${id}&app_id=${RECIPE_API_ID}&app_key=${RECIPE_API_KEY}`
  );
  Recipe.then(output => {
    recipe = output.data[0];
    return Comment.find({ recipe: id })
      .populate('userId')
      .then(comments => {
        res.render('recipe/single', { recipe, comments });
      });
  }).catch(error => {
    next(error);
  });
});

router.post('/:id/comment', (req, res, next) => {
  const data = {
    content: req.body.content,
    userId: req.user,
    recipe: req.params.id
  };

  Comment.create(data)
    .then(() => {
      res.redirect(`/recipe/${data.recipe}`);
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
