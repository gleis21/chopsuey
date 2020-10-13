const express = require('express');
const { InvoiceService } = require('../../pkg/services');
const router = express.Router();
const moment = require('moment');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv, personSrv, invoiceSrv, timeslotsSrv) => {
  /* GET home page. */
  router.get(
    '/bookings/:id',
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
          umsatzsteuerbefreit: c.get('Umsatzsteuerbefreit'),
          uid: c.get('UID'),
          org: c.get('Organisation'),
          lastName: c.get('Nachname'),
          firstName: c.get('Vorname'),
        }
      }
      const status = b.get('Status');
      if (!status || status === 'Neu' || status === 'Vorreserviert') {
        res.status(200).json({
          res: { 
            id: b.id, 
            title: b.get('Titel'),
            notes: b.get('Notes'),
            person: person,
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
    asyncMiddleware(async (req, res, next) => {
      const b = req.body;
      // Create a random PIN which the user will need to enter before 
      // being able to add data to thebooking_update form.
      const pin = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const booking = {
        title: b.title,
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
    asyncMiddleware(async (req, res, next) => {
      const b = req.body;
      const booking = {
        id: b.id,
        notes: b.notes,
        participantsCount: b. participantsCount,
        title: b.title,
        roomIds: [b.roomId],
        equipment: b.equipment,
        person: b.person,
        timeSlots: b.timeSlots
      };
      try {
        const r = await bookingSrv.update(booking);
        
        res.status(200).json({
          res: r,
          err: null
        });
      } catch (error) {
        console.log(error);
        throw new Error(error.toString());
      }
    })
  );

  router.get(
    '/bookings/:id/bookedequipment',
    asyncMiddleware(async (req, res, next) => {
      console.log('booking id:' + req.params.id);
      const invoiceItems = (await invoiceSrv.getInvoceItemsByBooking(req.params.id));
      const bookedequipment = invoiceItems
      .filter(it => it.get('ArtikelTyp')[0] === 'Ausstattung')
      .map(it => { 
        return { equipmentId: it.get('ArtikelId')[0], numberBooked: it.get('Anzahl') };
      });
      res.status(200).json({
        res: bookedequipment
      });
    })
  );

  router.get(
    '/bookings/:id/eventtimeslots',
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
        return { id: r.id, name: r.get('Key'), description: r.get('Beschreibung') };
      });
      res.status(200).json({
        res: equipment
      });
    })
  );

  return router;
};
