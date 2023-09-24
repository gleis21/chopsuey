const express = require('express');
const { InvoiceService } = require('../pkg/services');
const router = express.Router();
var auth = require('basic-auth');
var compare = require('tsscmp');
const moment = require('moment');

const asyncMiddleware = require('../pkg/middleware').asyncMiddleware;
const bookingCredsMiddleware = require('../pkg/middleware').bookingCredsMiddleware;
const authMiddleware = require('../pkg/middleware').authMiddleware;

const gleisUser = process.env.CS_USER;
const gleisPassword = process.env.CS_PASSWORD;

module.exports = (bookingSrv, itemsSrv, personSrv, invoiceSrv, timeslotsSrv) => {
  /* GET home page. */
  router.get(
    '/bookings/:id',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      const b = await bookingSrv.get(req.params.id);
      const customerIds = b.get('Mieter');
      var person = {};
      if (customerIds) {
        const customerId = customerIds[0];
        const c = await personSrv.getById(customerId);
        person = {
          email: c.get('Email'),
          city: c.get('Ort'),
          postcode: c.get('PLZ'),
          ano: c.get('Top'),
          hno: c.get('HausNr'),
          street: c.get('Strasse'),
          uid: c.get('UID'),
          org: c.get('Organisation'),
          lastName: c.get('Nachname'),
          firstName: c.get('Vorname'),
          tel: c.get('Tel'),
        }
      }
      const status = b.get('Status');
      if (!status || status === 'Neu' || status === 'Vorreserviert') {
        res.status(200).json({
          res: {
            id: b.id,
            name: b.get('Name'),
            notes: b.get('Notes'),
            participantsCount: b.get('TeilnehmerInnenanzahl'),
            person: person,
            isNGO: b.get('NGO')
          },
          err: null
        });
      } else {
        res.status(400).json({ res: null, err: 1001 });
      }
    })
  );

  // create new booking by booking_create.html
  router.post(
    '/bookings',
    authMiddleware(gleisUser, gleisPassword),
    asyncMiddleware(async (req, res, next) => {
      const b = req.body;
      // Create a random PIN which the user will need to enter before 
      // being able to add data to thebooking_update form.
      const pin = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const booking = {
        name: b.name,
        customerEmail: b.customerEmail,
        pin: pin,
        sendAutoMail: b.sendAutoMail
      };
      // Create a new entry in the booking table
      const r = await bookingSrv.create(booking);
      const editUrl = process.env.CS_BOOKING_EDIT_URL + '/' + r.getId();

      res.status(200).json({
        res: { editUrl: editUrl, email: b.customerEmail, pin: pin },
        err: null
      });
    })
  );

  router.put(
    '/bookings/:id',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res) => {
      const booking = {
        id: req.body.id,
        notes: req.body.notes,
        participantsCount: parseInt(req.body.participantsCount, 10),
        name: req.body.name,
        roomIds: [req.body.roomId],
        equipment: req.body.equipment,
        person: req.body.person,
        timeSlots: req.body.timeSlots,
        isNGO: req.body.isNGO
      };
      const r = await bookingSrv.update(booking);

      res.status(200).json({
        res: r,
        err: null
      });
    })
  );

  router.get(
    '/bookings/:id/bookedequipment',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      const invoiceItems = (await invoiceSrv.getInvoceItemsByBooking(req.params.id));
      const bookedequipment = invoiceItems
        .filter(it => it.get('ArtikelTyp')[0] === 'Ausstattung')
        .map(it => {
          return { equipmentId: it.get('ArtikelId')[0], numberBooked: it.get('Anzahl'), notes: it.get('Anmerkung') };
        });
      res.status(200).json({
        res: bookedequipment
      });
    })
  );

  router.get(
    '/bookings/:id/eventtimeslots',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      var i = 1;
      const eventtimeslots = (await timeslotsSrv.getBookingTimeSlots(req.params.id))
        .filter(it => it.get('Type') === 'Veranstaltung')
        .map(it => {
          return {
            id: i++,
            roomId: it.get('Raum')[0],
            type: 'Veranstaltung',
            beginnDate: moment(it.get('Beginn')).format('YYYY-MM-DD'),
            beginnH: moment(it.get('Beginn')).hours(),
            beginnM: moment(it.get('Beginn')).minutes(),
            endDate: moment(it.get('Beginn')).add(it.get('Duration'), 's').format('YYYY-MM-DD'),
            endH: moment(it.get('Beginn')).add(it.get('Duration'), 's').hours(),
            endM: moment(it.get('Beginn')).add(it.get('Duration'), 's').minutes(),
            notes: it.get('Notes')
          };
        });
      res.status(200).json({
        res: eventtimeslots
      });
    })
  );

  router.get(
    '/bookings/:id/availablerooms',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
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
    '/bookings/:id/availableequipment',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      const equipment = (await itemsSrv.getEquipment()).map(r => {
        return { id: r.id, name: r.get('Key'), description: r.get('Beschreibung'), quantity: r.get('Anzahl'), position: r.get('Position'), notesTitle: r.get('TitelAnmerkung') };
      });
      res.status(200).json({
        res: equipment
      });
    })
  );

  router.post(
    '/bookings/:id/checkout',
    asyncMiddleware(bookingCredsMiddleware(bookingSrv)),
    (req, res, next) => {
      return authMiddleware(res.locals.customerUserName, res.locals.pin, true)(req, res, next);
    },
    asyncMiddleware(async (req, res, next) => {
      const bookingId = req.params.id;
      const b = await bookingSrv.get(bookingId);
      if (b.get('Status') === 'Vertrag zum Unterschreiben verschickt' || b.get('Status') === 'CHECKOUT_TEST') {
        await bookingSrv.checkout(bookingId);
        res.status(200).json({});
      } else {
        res.status(403).json({});
      }
    })
  )

  return router;
};
