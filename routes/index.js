'use strict';

const { Router } = require('express');
const router = new Router();
const routeGuard = require('./../middleware/route-guard');

const User = require('./../models/user');

router.get('/', (req, res, next) => {
  res.render('index', { layout: false });
});

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

router.post('/:id/delete', (req, res, next) => {
  const { id } = req.params;
  User.findByIdAndDelete(id)
    .then(() => {
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
  const { id } = req.params;
  const { name, email } = req.body;
  console.log(name, email);
  const data = {
    name,
    email
  };
  User.findByIdAndUpdate(id, data)
    .then(user => {
      console.log(user);
      res.redirect('/private');
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:id/edit-picture', (req, res, next) => {
  const { id } = req.params;
  User.findOne({ _id: id })
    .then(user => {
      res.render('edit-picture', { user });
    })
    .catch(error => {
      next(error);
    });
});

const multer = require('multer');
const cloudinary = require('cloudinary');
const multerStorageCloudinary = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = multerStorageCloudinary({
  cloudinary,
  folder: 'this-images',
  allowFormats: ['jpg', 'png']
});
const uploader = multer({ storage });

router.post('/:id/edit-picture', uploader.single('picture'), (req, res, next) => {
  const { id } = req.params;
  const { url } = req.file;
  console.log(req.file);
  const data = {
    picture: url
  };
  console.log(data);
  User.findByIdAndUpdate(id, data)
    .then(user => {
      console.log(user);
      res.redirect('/private');
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
