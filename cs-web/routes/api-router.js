const express = require('express');
var services = require('../../pkg/services');
const router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv, timeSlotsSrv) => {
  /* GET home page. */
  router.get(
    '/bookings/:id',
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      res.status(200).json({
        res: { id: b.id, title: b.get('Titel') },
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
        equipmentIds: b.equipmentIds,
        person: b.person,
        eventsTimeRanges: b.eventsTimeRanges.map(
          e => new services.EventTimeRanges(e)
        )
      };
      // validate
      if (
        await timeSlotsSrv.areBookable(
          booking.roomIds[0],
          booking.eventsTimeRanges
        )
      ) {
        const r = await bookingSrv.update(booking);
        res.status(200).json({
          res: r,
          err: null
        });
      } else {
        res.status(409).json({ res: null, err: 'Zeitraum nich buchbar.' });
      }
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
