'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');

const axios = require('axios');

router.get('/search', (req, res, next) => {
  res.render('index', { title: 'Hello World!' });
});


module.exports = router;
