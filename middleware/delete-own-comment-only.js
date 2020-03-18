'use strict';

module.exports = (docs, id) => {
  for (let comment of docs) {
    comment.owner = comment.userId._id.toString() === id//req.user._id.toString();
  }
  // res.locals.user = req.user;
  // next();
};
