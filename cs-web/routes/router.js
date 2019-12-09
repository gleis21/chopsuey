const express = require('express');
const moment = require('moment');

const router = express.Router();

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
function groupBy(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

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
      const invoiceItems = await invoiceSrv.getInvoceItemsByBooking(
        b.get('Key')
      );
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
          city: p.get('Ort'),
          uid: p.get('UID'),
          umsatzsteuerbefreit: p.get('Umsatzsteuerbefreit')
        },
        timeSlots: ts
          .map(t => {
            return {
              room: t.get('RaumName')[0],
              type: t.get('Type'),
              beginn: moment(t.get('Beginn')),
              end: moment(t.get('Ende'))
            };
          })
          .filter(t => t.type !== 'Reinigung')
          .sort((a, b) => (a.beginn.isAfter(b.beginn) ? 1 : -1))
          .map(t => {
            return {
              room: t.room,
              type: t.type,
              beginn: t.beginn.format('DD.MM.YYYY hh:mm'),
              end: t.end.format('DD.MM.YYYY hh:mm')
            };
          }),
        invoiceItems: eq.map(e => {
          return {
            name: e.get('PriceName'),
            count: e.get('Anzahl')
          };
        }),
        notes: b.get('Notes')
      };

      console.log(JSON.stringify(contract));

      res.render('contract', contract);
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
