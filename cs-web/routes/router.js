const express = require('express');
const moment = require('moment');
var auth = require('basic-auth');
var compare = require('tsscmp');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');

const gleisUser = process.env.CS_USER;
const gleisPassword = process.env.CS_PASSWORD;

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
function groupBy(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

function basicAuth(validUser, validPass) {
  return (req, res, next) => {
    var credentials = auth(req);

    if (!credentials || !check(credentials.name, credentials.pass, validUser, validPass)) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="example"');
      res.end('Access denied');
    } else {
      next();
    }
  }
}

function check(providedUserame, providedPass, validUsername, validPass) {
  var valid = true;

  valid = compare(providedUserame, validUsername) && valid;
  valid = compare(providedPass, validPass) && valid;

  return valid;
}

module.exports = (bookingSrv, invoiceSrv, timeSlotsSrv, personSrv) => {
  /* GET home page. */
  router.get(
    '/new',
    basicAuth(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      res.render('booking_create');
    })
  );

  router.get(
    '/:id',
    asyncMiddleware(async (req, res, next) => {
      var id = req.params.id;
      const b = await bookingSrv.get(req.params.id);
      var userName = b.get('MieterEmail')[0];
      var pin = b.get('PIN');
      res.locals.customerUserName = userName;
      res.locals.pin = pin
      next()
    }),
    (req, res, next) => {
      return basicAuth(res.locals.customerUserName, res.locals.pin)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      res.render('booking_update');
    })
  );

  router.get(
    '/:id/contract/print',
    basicAuth(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      const browser = await puppeteer.launch();
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
  //   basicAuth(gleisUser, gleisPassword),
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
    basicAuth(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      if (b.get('Status') !== 'Vorreserviert') {
        res.status(403).json({});
      } else {
        const p = await personSrv.getById(b.get('Mieter'));
        const ts = await timeSlotsSrv.getBookingTimeSlots(b.getId());
        const invoiceItems = await invoiceSrv.getInvoceItemsByBooking(b.getId());
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
            .filter(t => t.type === 'Veranstaltung')
            .sort((a, b) => (a.beginn.isAfter(b.beginn) ? 1 : -1))
            .map(t => {
              return {
                room: t.room,
                type: t.type,
                beginn: t.beginn.format('DD.MM.YYYY HH:mm'),
                end: t.end.format('DD.MM.YYYY HH:mm')
              };
            }),
          invoiceItems: {
            equipment: invoiceItems.filter(e => e.get('ArtikelTyp')[0] === 'Ausstattung').map(e => {
              const discount = e.get('Rabatt') ? e.get('Rabatt') : 0;
              const finalPrice = parseFloat(e.get('SummeNetto')) - (parseFloat(e.get('SummeNetto')) * discount)
              return {
                name: e.get('ArtikelName'),
                count: e.get('Anzahl'),
                price: e.get('SummeNetto'),
                discount: discount,
                finalPrice: finalPrice
              };
            }),
            rooms: invoiceItems.filter(e => e.get('ArtikelTyp')[0] === 'Raum').map(e => {
              const discount = e.get('Rabatt') ? e.get('Rabatt') : 0;
              const finalPrice = parseFloat(e.get('SummeNetto')) - (parseFloat(e.get('SummeNetto')) * discount)
              return {
                name: e.get('ArtikelName'),
                price: e.get('SummeNetto'),
                discount: discount,
                finalPrice: finalPrice
              };
            })
          },
          notes: b.get('Notes')
        };

        res.render('contract', contract);
      }
    })
  );

  return router;
};
