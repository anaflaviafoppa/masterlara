'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');
const Comment = require('./../models/comment');
const User = require('./../models/user');

const RECIPE_API_ID = process.env.RECIPE_API_ID;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

const axios = require('axios');

router.get('/search', routeGuard, (req, res, next) => {
  //Params to request the API
  const params = {
    q: req.query.item,
    app_id: RECIPE_API_ID,
    app_key: RECIPE_API_KEY,
    health: req.query.health
  };

  let ingredientsArray = params.q.split(' ');

  const id = req.user._id;

  User.findById(id)
    .then(user => {
      user.recipeSearch = ingredientsArray;
      user.save();
    })
    .then(() => {
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
                
                recipe.recipe.ingredientsStorage.push(recipeArray[i]);
              }
            }
            //criar uma KEY com o valor da porcentagem:
            recipe.percentage = ((counter / recipeArray.length) * 100).toFixed(0);

           
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
    })
    .catch(error => {
      next(error);
    });
});

//GET - Recipe Book
/*router.get('/:id/recipe-book', (req,res,next) =>{
  res.render('recipe/recipebook');
});*/

router.get('/:id/recipe-book', (req, res, next) => {
  const id = req.params.id;
  let userRecipe;

  User.findById(id).then(user => {
    userRecipe = user;
console.log
    res.render('recipe/recipebook', { user });
  });
});

// Router for the SINGLE view. It displays the recipe API info and renders the comments related to that recipe
router.get('/:id', routeGuard, (req, res, next) => {
  const { id } = req.params;

  const recipeSearch = req.user.recipeSearch;

  let recipe;
  let comments;
  let user;
  const Recipe = axios.get(
    `https://api.edamam.com/search?r=http%3A%2F%2Fwww.edamam.com%2Fontologies%2Fedamam.owl%23recipe_${id}&app_id=${RECIPE_API_ID}&app_key=${RECIPE_API_KEY}`
  );
  Recipe.then(output => {
    recipe = output.data[0];

    //console.log(recipe.ingredientLines);

    const ingredientLines = recipe.ingredientLines;
    recipe.ingredientsStorage = [];
    recipe.ingredientsNotStorage = [];

    for (let i = 0; i < recipeSearch.length; i++) {
      for (let j = 0; j < ingredientLines.length; j++) {
        const incluido = ingredientLines[j].toLowerCase().includes(recipeSearch[i]);

        if (incluido) {
          recipe.ingredientsStorage.push(ingredientLines[j]);

          ingredientLines.splice(j, 1);

          //console.log(ingredientsArray);
          /*recipe.recipe.ingredientsStorage.push(ingredientLines[j]);
          console.log(recipe.recipe.ingredientsStorage);*/
        } else if (!incluido) {
          recipe.ingredientsNotStorage.push(ingredientLines[j]);
        }
      }
    }

    return Comment.find({ recipe: id })
      .populate('userId')
      .lean();
  })
    .then(docs => {
      // finding comments associated to that recipe and extracting the user info to display user name and user picture
      comments = docs;
      // pass to view if the user is the author of the comment, then he will see the DELETE COMMENT button
      
      
      for (let comment of docs) {
        comment.owner = comment.userId._id.toString() === req.user._id.toString();
      }

      return User.findById(req.user._id).lean();
    })
    .then(doc => {
      user = doc;
      let counter = 0;

      //Verify if the user already have add the recipe:
      for (let r = 0; r < user.favoriteRecipes.length; r++) {
        if (user.favoriteRecipes[r].name === recipe.label) {
          counter++;
        }
      }

      if (counter > 0) {
        user.isFavorite = true;
      } else {
        user.isFavorite = false;
      }
      
    })
    .then(() => {
      res.render('recipe/single', { recipe, comments, user });
    })

    .catch(error => {
      next(error);
    });
});

// POST Router to create a comment which includes content+username+image(optional)
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

//POST Router to delete comment, action is in one POST button attached to the comment in the SINGLE view
router.post('/:recipeId/comment/:commentId/delete', (req, res, next) => {
  const { recipeId, commentId } = req.params;

  Comment.findByIdAndDelete(commentId)
    .then(() => {
      res.redirect(`/recipe/${recipeId}`);
    })
    .catch(error => {
      next(error);
    });
});

//POST router to add a recipe to Recipe BOOK
router.post('/:recipeId/recipebook', (req, res, next) => {
  const id = req.params.recipeId;

  const Recipe = axios.get(
    `https://api.edamam.com/search?r=http%3A%2F%2Fwww.edamam.com%2Fontologies%2Fedamam.owl%23recipe_${id}&app_id=${RECIPE_API_ID}&app_key=${RECIPE_API_KEY}`
  );

  Recipe.then(output => {
    let recipe = output.data[0];
    

    const idUser = req.user._id;

    const data = {
      id,
      name: recipe.label,
      image: recipe.image
    };

    let saveRecipe;

    User.findById(idUser)
      .then(user => {
        saveRecipe = user;
        let counter = 0;
        let index = null;
        console.log('PRIMEIRO DE TUDO ' + counter)
        //Verify if the user already have add the recipe:
        for (let r = 0; r < saveRecipe.favoriteRecipes.length; r++) {
          if (saveRecipe.favoriteRecipes[r].name === data.name) {
            counter++;
            index = r;
            console.log(counter);
          }
        }

        if (counter === 0) {
          saveRecipe.favoriteRecipes.push(data);
          saveRecipe.save();
          
        }else if(counter>0) {
          counter = 0;
          console.log('TIRARRRR DO FAVORITOOOOOOOOOOOOO');
          saveRecipe.favoriteRecipes.splice(index,1);
          saveRecipe.save();
          
          console.log('Segundo '+ counter);

        }
      })
      .then(() => {
        res.redirect(`/recipe/${id}`);
        
      })
      .catch(error => {
        next(error);
      });
  });
});

module.exports = router;
