'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('./models/user');
const bcryptjs = require('bcryptjs');

const nodemailer = require('nodemailer');

const EMAIL =  process.env.EMAIL_USER;
const PASSWORD = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  //...
  service:'Gmail',
  auth:{
    user: EMAIL,
    pass: PASSWORD
  }
});


passport.serializeUser((user, callback) => {
  callback(null, user._id);
});

passport.deserializeUser((id, callback) => {
  User.findById(id)
    .then(user => {
      callback(null, user);
    })
    .catch(error => {
      callback(error);
    });
});

passport.use(
  'local-sign-up',
  new LocalStrategy(
    {
      usernameField: 'email',
      passReqToCallback: true
    },
    (req, email, password, callback) => {
      const name = req.body.name;
      let user;

      User.findOne({ email })
        .then(doc => {
          if (doc) {
            return Promise.reject(new Error('EMAIL_ALREADY_REGISTERED'));
          } else {
            return bcryptjs.hash(password, 10);
          }
        })
        .then(hash => {
          return User.create({
            name,
            email,
            passwordHash: hash,
            picture: '/images/chef.png'
          });
        })
        .then(userCreated => {
          user = userCreated;

          transporter.sendMail({
            from: `Master Lara <${EMAIL}>`,
            to: user.email,
            subject:'Welcome to Master Lara!',
            //text: 'Hello World!'
            html:"<h1>Welcome Master Lara!</h1><p>Teste</p>"
          });
        })
        .then(() => {
          callback(null,user);
        })
        .catch(error => {
          callback(error);
        });
    }
  )
);

passport.use(
  'local-sign-in',
  new LocalStrategy({ usernameField: 'email' }, (email, password, callback) => {
    let user;
    User.findOne({
      email
    })
      .then(document => {
        user = document;
        if (user) {
          return bcryptjs.compare(password, user.passwordHash);
        } else {
          return Promise.reject(new Error('EMAIL_NOT_REGISTERED'));
        }
      })
      .then(passwordMatchesHash => {
        if (passwordMatchesHash) {
          callback(null, user);
        } else {
          callback(new Error('WRONG_PASSWORD'));
        }
      })
      .catch(error => {
        callback(error);
      });
  })
);