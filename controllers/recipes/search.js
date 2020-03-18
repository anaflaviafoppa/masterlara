const User = require('./../../models/user');
const axios = require('axios');

const RECIPE_API_ID = process.env.RECIPE_API_ID;
const RECIPE_API_KEY = process.env.RECIPE_API_KEY;

module.exports = (req, res, next) => {
  //Params to request the API
  const params = {
    q: req.query.item,
    app_id: RECIPE_API_ID,
    app_key: RECIPE_API_KEY,
    health: req.query.health
  };

  let ingredientsArray = params.q.split(' ');
  let userList;

  const id = req.user._id;

  User.findById(id)
    .then(user => {
      user.recipeSearch = ingredientsArray;
      userList = user;
      user.save();
      console.log(userList);
    })
    .then(() => {
      let recipes;

      // Activate API > send request
      const Recipe = axios.get(`https://api.edamam.com/search`, { params });

      Recipe.then(output => {
        // ingredientsToView(output);
        recipes = output.data.hits;
        //SPLIT BY SPACE:

        //VERIFICAR a quantidade de ingredientes que temos/ingredientes
        for (const recipe of recipes) {
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
        res.render('recipe/search', { recipes, userList });
      });
    })
    .catch(error => {
      next(error);
    });
};
