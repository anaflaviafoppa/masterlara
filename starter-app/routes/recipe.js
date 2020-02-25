'use strict';





const { Router } = require('express');
const router = new Router();
//const routeGuard = require('./../middleware/route-guard');
const Comment = require('./../models/comment');
const User = require('./../models/user');

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

  let ingredientsArray = params.q.split(' ');

  

  const id = req.user._id;
  //console.log(ingredientsArray);
  
  User
    .findById(id)
    .then((user) => {
      user.recipeSearch = ingredientsArray;
      user.save();
    })
    .then(()=> {

      let recipes;

      // Activate API > send request
      const Recipe = axios.get(`https://api.edamam.com/search`, { params });

      Recipe.then(output => {
        recipes = output.data.hits;
        //SPLIT BY SPACE:
        
        //VERIFICAR a quantidade de ingredientes que temos/ingredientes
        for (let recipe of recipes) {
          //otimizar por array a busca:
          ingredientsArray = params.q.split(' '); 

          //quantos ingredientes da receita são iguais ao que possuimos na geladeira:
          let counter = 0; 

          //array de Ingredientes do API:
          const recipeArray = recipe.recipe.ingredientLines;
          recipe.recipe.ingredientsStorage = [];

          for (let i = 0; i < recipeArray.length; i++) {
            for (let j = 0; j < ingredientsArray.length; j++) {
            
              const incluido = recipeArray[i].toLowerCase().includes(ingredientsArray[j]);

              if (incluido) {
                counter++;
                ingredientsArray.splice(j, 1);
                //console.log(ingredientsArray);
                recipe.recipe.ingredientsStorage.push(recipeArray[i]);
              }
            }
            //criar uma KEY com o valor da porcentagem:
            recipe.percentage = ((counter / recipeArray.length) * 100).toFixed(0);

            //console.log(recipes[0].recipe);
          }
        }


        //Ordenar as recipes por porcentagem:
        recipes.sort((a, b) => {
          if (parseInt(a.percentage) < parseInt(b.percentage)) {
            return 1;
          }
          if (parseInt(a.percentage) > parseInt(b.percentage)) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });

        //Renderizar as informações
        res.render('recipe/search', { recipes });

      });

  }).catch(error => {
    next(error);
  });
});

router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  const recipeSearch = req.user.recipeSearch;
  //console.log(recipeSearch);



  let recipe;
  const Recipe = axios.get(
    `https://api.edamam.com/search?r=http%3A%2F%2Fwww.edamam.com%2Fontologies%2Fedamam.owl%23recipe_${id}&app_id=${RECIPE_API_ID}&app_key=${RECIPE_API_KEY}`
  );
  Recipe.then(output => {
    recipe = output.data[0];

    //console.log(recipe.ingredientLines);

    const ingredientLines = recipe.ingredientLines;
    recipe.ingredientsStorage = [];
    recipe.ingredientsNotStorage = [];
    
    for(let i=0;i<recipeSearch.length;i++) {
      for(let j=0;j<ingredientLines.length;j++) {

        const incluido = ingredientLines[j].toLowerCase().includes(recipeSearch[i]);

        if (incluido) {
          recipe.ingredientsStorage.push(ingredientLines[j]);
          
          ingredientLines.splice(j,1);
          
          //console.log(ingredientsArray);
          /*recipe.recipe.ingredientsStorage.push(ingredientLines[j]);
          console.log(recipe.recipe.ingredientsStorage);*/
        }else if(!incluido){
          recipe.ingredientsNotStorage.push(ingredientLines[j]);
        }
      }
    }

    
    return Comment.find({ recipe: id })
      .populate('userId')
      .then(comments => {

        res.render('recipe/single', { recipe, comments});
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

router.post('/:recipeId/comment/:commentId/delete', (req, res, next) => {
  const { recipeId, commentId } = req.params;
  console.log(recipeId, commentId);
  Comment.findByIdAndDelete(commentId)
    .then(() => {
      res.redirect(`/recipe/${recipeId}`);
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
