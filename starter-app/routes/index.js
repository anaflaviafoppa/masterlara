'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');

const User = require('./../models/user');

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Hello World!' });
});

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

router.post('/:id/delete', (req, res, next) => {
  const { id } = req.params;
  User.findById(id)
    .then(user => {
      console.log(user);
      res.redirect('/');
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:id/edit', (req, res, next) => {
  const { id } = req.params;
  User.findOne({ _id: id })
    .then(user => {
      res.render('edit', { user });
    })
    .catch(error => {
      next(error);
    });
});

router.post('/:id/edit', (req, res, next) => {
  console.log(req.body);
  // const { id } = req.params;
  const { name, email } = req.body;
  console.log(name, email);
  // const data = {
  //   name,
  //   email
  // };
  // User.findByIdAndUpdate(id, data)
  //   .then(user => {
  //     console.log(user);
  res.redirect('/private');
  // })
  // .catch(error => {
  //   next(error);
  // });
});

module.exports = router;
