const express = require('express');
const moment = require('moment');

const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');

const asyncMiddleware = require('../../pkg/middleware').asyncMiddleware;
const bookingCredsMiddleware = require('../../pkg/middleware').bookingCredsMiddleware;
const authMiddleware = require('../../pkg/middleware').authMiddleware;
const e = require('express');

const gleisUser = process.env.CS_USER;
const gleisPassword = process.env.CS_PASSWORD;



module.exports = (bookingSrv, invoiceSrv, timeSlotsSrv, personSrv) => {
  /* GET home page. */
  router.get(
    '/new',
    authMiddleware(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      res.render('booking_create');
    })
  );

  router.get(
    '/:id',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      res.cookie('cs-creds', Buffer.from(res.locals.customerUserName + ':' + res.locals.pin).toString('base64'), { maxAge: 7200000, httpOnly: true, encode: String, overwrite: true });
      res.render('booking_update');
    })
  );

  router.get(
    '/:id/contract/print',
    authMiddleware(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH,
        args: ['--no-sandbox'], // This was important. Can't remember why
      });
      const page = await browser.newPage();
      const contractUrl = `http://${gleisUser}:${gleisPassword}@localhost:3000/bookings/${req.params.id}/contract`;
      await page.goto(contractUrl, {
        waitUntil: 'networkidle2'
      });
      // /tmp/chopsuey dir must exist!!
      const tmpDir = '/tmp/chopsuey';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
      }
      const fileName = 'gleis21_' + new Date().valueOf().toString() + '.pdf';
      const filePath = tmpDir + '/' + fileName;
      await page.pdf({ path: filePath, format: 'A4' });

      await browser.close();

      const rs = fs.createReadStream(filePath, { autoClose: true });
      var stat = fs.statSync(filePath);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
      rs.pipe(res);
    })
  );

  // router.get(
  //   '/:id/invoice',
  //   authMiddleware(gleisUser, gleisPassword),
  //   asyncMiddleware(async (req, res, next) => {
  //     const b = await bookingSrv.get(req.params.id);
  //     const invoice = await invoiceSrv.getInvoceByBooking(b.get('Key'));
  //     const invoiceItems = await invoiceSrv.getInvoceItemsByBooking(
  //       b.get('Key')
  //     );
  //     const p = await personSrv.getById(b.get('Mieter'));
  //     const inv = {
  //       invoiceNo: invoice.get('Key'),
  //       address: p.get('Strasse') + ' ' + p.get('HausNr') + '/' + p.get('Top'),
  //       postCode: p.get('PLZ'),
  //       city: p.get('Ort'),
  //       uid: p.get('UID')
  //     };
  //   })
  // );

  router.get(
    '/:id/contract',
    authMiddleware(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      if (b.get('Status') !== 'Vorreserviert') {
        res.status(403).json({});
      } else {
        const p = await personSrv.getById(b.get('Mieter'));
        const ts = await timeSlotsSrv.getBookingTimeSlots(b.getId());
        const invoiceItems = await invoiceSrv.getInvoceItemsByBooking(b.getId());

        const equipment = invoiceItems.filter(e => e.get('ArtikelTyp')[0] === 'Ausstattung').map(e => {
          const discount = e.get('Rabatt') ? e.get('Rabatt') : 0;
          const finalPrice = parseFloat(e.get('SummeNetto')) - (parseFloat(e.get('SummeNetto')) * discount)
          return {
            name: e.get('ArtikelName'),
            count: e.get('Anzahl'),
            price: e.get('SummeNetto'),
            discount: discount,
            finalPrice: finalPrice,
            notes: e.get('Anmerkung')
          };
        });
        const equipmentPriceSum = equipment.map(e => e.finalPrice).reduce((a, c) => a + c);
        const rooms = invoiceItems.filter(e => e.get('ArtikelTyp')[0] === 'Raum').map(e => {
          const discount = e.get('Rabatt') ? e.get('Rabatt') : 0;
          const finalPrice = parseFloat(e.get('SummeNetto')) - (parseFloat(e.get('SummeNetto')) * discount)
          return {
            name: e.get('ArtikelName'),
            price: e.get('SummeNetto'),
            discount: discount,
            finalPrice: finalPrice
          };
        });
        const roomsPriceSum = rooms.map(e => e.finalPrice).reduce((a, c) => a + c);

        const contract = {
          name: b.get('Name'),
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
            uid: p.get('UID')
          },
          timeSlots: ts
            .map(t => {
              const x = {
                room: t.get('RaumName')[0],
                moeblierung: t.get('Moeblierung'),
                type: t.get('Type'),
                beginn: moment(t.get('Beginn')),
                end: moment(t.get('Ende'))
              };
              return x;
            })
            .filter(t => t.type === 'Veranstaltung')
            .sort((a, b) => (a.beginn.isAfter(b.beginn) ? 1 : -1))
            .map(t => {
              return {
                room: t.room,
                type: t.type,
                beginn: t.beginn.format('DD.MM.YYYY HH:mm'),
                end: t.end.format('DD.MM.YYYY HH:mm'),
                moeblierung: t.moeblierung
              };
            }),
          invoiceItems: {
            equipment: equipment,
            equipmentPriceSum: equipmentPriceSum,
            rooms: rooms,
            roomsPriceSum: roomsPriceSum
          },
          notes: b.get('Notes')
        };

        res.render('contract', contract);
      }
    })
  );

  return router;
};
