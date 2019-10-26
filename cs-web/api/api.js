const express = require('express');

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

module.exports = (bookingSrv, itemsSrv) => {
  /* GET home page. */
  router.get(
    '/bookings/:id',
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      res.send({
        booking: { id: b.id, title: b.get('Titel') }
      });
    })
  );

  router.get(
    '/rooms',
    asyncMiddleware(async (req, res, next) => {
      const rooms = (await itemsSrv.getRooms()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      res.send({
        rooms: rooms
      });
    })
  );

  router.get(
    '/equipment',
    asyncMiddleware(async (req, res, next) => {
      const equipment = (await itemsSrv.getEquipment()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      res.send({
        equipment: equipment
      });
    })
  );
  /*
router.post(
  '/:id',
  body('email').custom(value => {
    return User.findUserByEmail(value).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use');
      }
    });
  }),
  asyncMiddleware(async (req, res, next) => {
    console.log(JSON.stringify(req.body));
  })
); */
  /* 
  router.post(
    '/:id',
    body('email').custom(value => {
      return User.findUserByEmail(value).then(user => {
        if (user) {
          return Promise.reject('E-mail already in use');
        }
      });
    }),
    asyncMiddleware(async (req, res, next) => {
      console.log(JSON.stringify(req.body));
    })
  ); */

  return router;
};
