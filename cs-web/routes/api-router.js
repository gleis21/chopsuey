const express = require('express');
var services = require('../../pkg/services');
const router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv) => {
  /* GET home page. */
  router.get(
    '/bookings/:id',
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      const status = b.get('Status');
      if (!status || status === 'Angefragt') {
        console.log(JSON.stringify(b));
        res.status(200).json({
          res: { id: b.id, title: b.get('Titel') },
          err: null
        });
      } else {
        res.status(403).json({ res: null, err: 403 });
      }
    })
  );

  router.post(
    '/bookings',
    asyncMiddleware(async (req, res, next) => {
      const b = req.body;
      const booking = {
        title: b.title
      };
      const r = await bookingSrv.create(booking);
      const id = r.getId();
      const editUrl = process.env.CS_BOOKING_EDIT_URL + '/' + id;
      res.status(200).json({
        res: { editUrl: editUrl },
        err: null
      });
    })
  );

  router.put(
    '/bookings/:id',
    asyncMiddleware(async (req, res, next) => {
      const b = req.body;
      const booking = {
        id: b.id,
        title: b.title,
        roomIds: [b.roomId],
        equipment: b.equipment,
        person: b.person,
        timeSlotsGroups: b.timeSlotsGroups.map(
          e => new services.TimeSlotsGroup(e)
        )
      };
      const r = await bookingSrv.update(booking);
      res.status(200).json({
        res: r,
        err: null
      });
    })
  );

  router.get(
    '/rooms',
    asyncMiddleware(async (req, res, next) => {
      const rooms = (await itemsSrv.getRooms()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      res.status(200).json({
        res: rooms
      });
    })
  );

  router.get(
    '/equipment',
    asyncMiddleware(async (req, res, next) => {
      const equipment = (await itemsSrv.getEquipment()).map(r => {
        return { id: r.id, name: r.get('Key') };
      });
      res.status(200).json({
        res: equipment
      });
    })
  );

  return router;
};
