const express = require('express');
const router = express.Router();
const { WebClient } = require('@slack/web-api');
const slackClient = new WebClient(process.env.SLACK_TOKEN);

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = (bookingSrv, itemsSrv, personSrv) => {
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
      if (!status || status === 'Angefragt') {
        res.status(200).json({
          res: { 
            id: b.id, 
            title: b.get('Titel'),
            person: person,
          },
          err: null
        });
      } else {
        res.status(403).json({ res: null, err: 403 });
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
        pin: pin
      };
      
      // try to get entry of person table by email if it was a customer (by limiting to the „Mieter“ view)
      const c =  await personSrv.getByEmail(b.customerEmail, "Mieter");

      // Create a new entry in the booking table
      const r = await bookingSrv.create(booking);
      
      const editUrl = process.env.CS_BOOKING_EDIT_URL + '/' + r.getId();

      
      res.status(200).json({
        res: { 
          editUrl: editUrl, 
          email: b.customerEmail, 
          customer: c ? c.fields : false,
          pin: pin },
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
        // Use the `chat.postMessage` method to send a message from this app
        await slackClient.chat.postMessage({
          channel: '#chopsuey-buchungen',
          text: `Neue Anfrage für die Buchung "${booking.title}" von ${booking.person.email}`,
        });
        res.status(200).json({
          res: r,
          err: null
        });
      } catch (error) {
        console.log(error);
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
    '/agents',
    asyncMiddleware(async (req, res, next) => {
      const agents = (await personSrv.list("Bearbeiter EG")).map(p => {
        return { 
          id: p.get('id'),
          email: p.get('Email'),
          name: p.get('Vorname') + " " + p.get('Nachname')
        };
       });
      res.status(200).json(agents.length);
    })
  );

  router.get(
    '/equipment',
    asyncMiddleware(async (req, res, next) => {
      const equipment = (await itemsSrv.getEquipment()).map(r => {
        return { id: r.id, name: r.get('Key'), note: r.get('Beschreibung') };
      });
      res.status(200).json({
        res: equipment
      });
    })
  );

  return router;
};
