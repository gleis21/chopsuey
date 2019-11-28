const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv, timeSlotsSrv, personSrv) => {
  /* GET home page. */
  router.get(
    '/:id',
    asyncMiddleware(async (req, res, next) => {
      res.render('booking');
    })
  );

  router.get(
    '/:id/contract',
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      const p = await personSrv.getById(b.get('Mieter'));
      const ts = await timeSlotsSrv.getBookingTimeSlots(b.get('Key'));
      const eq = await itemsSrv.getBookedEquipment(b.get('Key'));
      console.log(JSON.stringify(eq));
      console.log('nach eq');
      const contract = {
        title: b.get('Titel'),
        participantsCount: b.get('TeilnehmerInnenanzahl'),
        person: {
          name: p.get('Vorname') + ' ' + p.get('Nachname'),
          telefon: p.get('Tel'),
          email: p.get('Email'),
          org: p.get('Organisation'),
          address:
            p.get('Strasse') + ' ' + p.get('HausNr') + '/' + p.get('Top'),
          postCode: p.get('PLZ'),
          city: p.get('Ort')
        },
        timeSlots: ts.map(t => {
          return {
            room: t.get('RaumName')[0],
            type: t.get('Type'),
            beginn: t.get('Beginn'),
            end: t.get('Ende')
          };
        }),
        equipment: eq.map(e => {
          return {
            name: e.get('AusstattungKey')[0],
            count: e.get('Anzahl')
          };
        }),
        notes: b.get('Notes')
      };

      console.log(JSON.stringify(contract));

      const m = { foo: 'bar' };
      res.render('contract', m);
    })
  );

  router.get(
    '/:id/invoice',
    asyncMiddleware(async (req, res, next) => {
      res.render('invoice');
    })
  );

  return router;
};
