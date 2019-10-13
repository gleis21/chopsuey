var express = require('express');
var router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv, timeslotsSrv) => {
  /* GET home page. */
  router.get(
    '/:id',
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      const rooms = (await itemsSrv.getRooms()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      const equipment = (await itemsSrv.getEquipment()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      res.render('booking', {
        booking: { id: b.id, title: b.get('Titel') },
        rooms: rooms,
        equipment: equipment
      });
    })
  );

  router.post(
    '/:id',
    asyncMiddleware(async (req, res, next) => {
      console.log(JSON.stringify(req.body));
    })
  );

  return router;
};
