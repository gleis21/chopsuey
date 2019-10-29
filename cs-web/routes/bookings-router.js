const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const { body } = require('express-validator');
/* 
app.post(
  '/user',
  body('email').custom(value => {
    return User.findUserByEmail(value).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use');
      }
    });
  }),
  (req, res) => {
    // Handle the request
  }
); */

module.exports = () => {
  /* GET home page. */
  router.get(
    '/:id',
    asyncMiddleware(async (req, res, next) => {
      res.render('booking');
    })
  );

  return router;
};
