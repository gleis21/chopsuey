const moment = require('moment');

class InvoiceService {
  constructor(base, itemsSrv) {
    this.rechnungenTable = base('Rechnungen');
    this.rechnungspostenTable = base('Rechnungsposten');
    this.preiseTable = base('Preise');
    this.itemsSrv = itemsSrv;
  }

  async createInvoice(invoiceItems) {
    return await this.rechnungenTable.create({
      Rechnungsposten: invoiceItems.map(it => it.getId()),
      Status: 'Neu',
      Rechnungsdatum: moment().toISOString()
    });
  }

  async getInvoceByBooking(bookingKey) {
    return await this.rechnungenTable
      .select({
        maxRecords: 1,
        view: 'Grid view',
        filterByFormula: '{BuchungKey}=' + "'" + bookingKey + "'"
      })
      .firstPage();
  }

  async getInvoceItemsByBooking(bookingKey) {
    return await this.rechnungspostenTable
      .select({
        view: 'Grid view',
        filterByFormula: '{BuchungKey}=' + "'" + bookingKey + "'"
      })
      .firstPage();
  }

  async getEquipmentPrices() {
    return await this.preiseTable
      .select({ view: 'AusstattungPreise' })
      .firstPage();
  }

  async createInvoiceItems(items) {
    const eqPrices = await this.getEquipmentPrices();
    // items have an id and count
    const invoiceItems = items
      .map(it => {
        return {
          priceId: eqPrices
            .filter(ep => ep.get('Artikel')[0] === it.id)[0]
            .getId(),
          count: it.count
        };
      })
      .map(p => {
        return {
          fields: {
            Anzahl: parseInt(p.count, 10),
            Artikel: [p.priceId]
          }
        };
      });
    return await this.rechnungspostenTable.create(invoiceItems);
  }
}

class BookingService {
  constructor(base, timeSlotsSrv, personSrv, invoiceSrv) {
    this.table = base('Buchungen');
    this.timeSlotsSrv = timeSlotsSrv;
    this.personSrv = personSrv;
    this.invoiceSrv = invoiceSrv;
  }
  async get(id) {
    return await this.table.find(id);
  }

  async create(b) {
    const customer = await this.personSrv.getByEmail(b.customerEmail);
    if (customer) {
      return await this.table.create({ Titel: b.title, Mieter: [customer.getId()], PIN: b.pin });
    }
    return await this.table.create({ Titel: b.title, PIN: b.pin });
  }

  async update(b) {
    const person = await this.personSrv.createOrUpdate(b.person);
    const ts = await this.timeSlotsSrv.create(b.id, b.timeSlots);
    const equipmentInvoiceItems = await this.invoiceSrv.createInvoiceItems(
      b.equipment
    );
    const invoice = await this.invoiceSrv.createInvoice(equipmentInvoiceItems);
    const bk = {
      Titel: b.title,
      TeilnehmerInnenanzahl: b.participantsCount,
      Status: 'Angefragt',
      Mieter: [person.getId()],
      Notes: b.notes,
      Timeslots: ts.map(s => s.getId()),
      Rechnungen: [invoice.getId()]
    };
    return await this.table.update(b.id, bk);
  }
}

class BookableItemsService {
  constructor(base) {
    this.table = base('Artikel');
    this.rooms = [];
    this.equipment = [];
  }
  async getRooms() {
    if (this.rooms.length === 0) {
      this.rooms = await this.table
        .select({ view: 'Raeume' })
        .firstPage();
    }
    return this.rooms;
  }

  async getEquipment() {
    if (this.equipment.length === 0) {
      this.equipment = await this.table
        .select({ view: 'Ausstattung' })
        .firstPage();
    }
    return this.equipment;
  }
}

class TimeSlotsService {
  constructor(base, itemsSrv) {
    this.table = base('Timeslots');
    this.itemsSrv = itemsSrv;
  }

  async getBookingTimeSlots(bookingKey) {
    var x = await this.table
      .select({
        view: 'Alles',
        filterByFormula: '{BuchungKey}=' + "'" + bookingKey + "'"
      })
      .firstPage();
    return x;
  }

  async getTimeSlotsAfterToday() {
    const ts = await this.table
      .select({ maxRecords: 1000, view: 'Zukunft' })
      .firstPage();
    const groupedByRoom = ts.reduce((acc, curr) => {
      const roomIds = curr.get('Raum');
      if (roomIds && roomIds.length === 1) {
        const roomId = roomIds[0];
        if (!acc[roomId]) acc[roomId] = [];
        acc[roomId].push({
          beginn: moment(curr.get('Beginn')),
          end: moment(curr.get('Ende'))
        });
      }
      return acc;
    }, {});

    return groupedByRoom;
  }

  async create(bookingID, timeSlots) {
    const getTimeSlotsAfterToday = async () => {
      const ts = await this.table
      .select({ maxRecords: 1000, view: 'Zukunft' })
      .firstPage();
    const groupedByRoom = ts.reduce((acc, curr) => {
      const roomIds = curr.get('Raum');
      if (roomIds && roomIds.length === 1) {
        const roomId = roomIds[0];
        if (!acc[roomId]) acc[roomId] = [];
        acc[roomId].push({
          beginn: moment(curr.get('Beginn')),
          end: moment(curr.get('Ende'))
        });
      }
      return acc;
    }, {});

    return groupedByRoom;
    };
    const isBookable = async (roomId, beginn, end, futureBookingsByRoom) => {
      if (Object.keys(futureBookingsByRoom).length === 0) {
        return true;
      }
      const rooms = await this.itemsSrv.getRooms();
      const gastroID = rooms.filter(r => r.get('Key') === 'Gastro')[0].getId();
      const saalID = rooms.filter(r => r.get('Key') === 'Saal 21')[0].getId();
      const salonID = rooms.filter(r => r.get('Key') === 'Salon 21')[0].getId();
      const stationID = rooms
        .filter(r => r.get('Key') === 'Station 21')[0]
        .getId();
      const saalSalonID = rooms
        .filter(r => r.get('Key') === 'Saal + Salon')[0]
        .getId();
      const saalSalonStationID = rooms
        .filter(r => r.get('Key') === 'Saal + Salon + Station')[0]
        .getId();
      const room = rooms.filter(r => r.getId() === roomId)[0];
      let roomTimeslots = [];
      if (
        room.getId() === saalID ||
        room.getId() === salonID ||
        room.getId() === stationID ||
        room.getId() === gastroID
      ) {
        roomTimeslots = futureBookingsByRoom[room.getId()];
      } else if (room.getId() === saalSalonID) {
        roomTimeslots = futureBookingsByRoom[saalSalonID]
          .concat(futureBookingsByRoom[saalID])
          .concat(futureBookingsByRoom[salonID]);
      } else if (room.id === saalSalonStationID) {
        roomTimeslots = futureBookingsByRoom[saalSalonStationID]
          .concat(futureBookingsByRoom[saalID])
          .concat(futureBookingsByRoom[salonID])
          .concat(futureBookingsByRoom[stationID]);
      }
      if (roomTimeslots.filter(r => r).length == 0) {
        return true;
      }
      const bookable = roomTimeslots
        .filter(r => r)
        .reduce((acc, curr) => {
          const tsBeginn = curr.beginn;
          const tsEnd = curr.end;
          const bookable =
            moment(beginn).isAfter(moment(tsEnd)) ||
            moment(end).isBefore(moment(tsBeginn));
          return acc && bookable;
        }, true);
  
      return bookable;
    };
    const slots = await Promise.all(timeSlots.map(async ts => {
      const beginn = moment(ts.beginnDate)
        .add(ts.beginnH, 'h')
        .add(ts.beginnM, 'minutes');

      const end = moment(ts.endDate)
        .add(ts.endH, 'h')
        .add(ts.endM, 'minutes');
      const durSec = moment(end).diff(beginn, 'seconds');
      const futureBookingsByRoom = await getTimeSlotsAfterToday()
      const bookable = await isBookable(ts.roomId, beginn, end, futureBookingsByRoom);
      return {
        fields: {
          Beginn: beginn.toISOString(),
          Duration: durSec,
          Type: 'Veranstaltung',
          Buchung: [bookingID],
          Raum: [ts.roomId],
          Status: bookable ? 'OK' : 'Conflict'
        }
      };
    }));
    return await this.table.create(slots); // returns records (record.getId())
  }

  async isBookable(roomId, beginn, end, futureBookingsByRoom) {
    if (Object.keys(futureBookingsByRoom).length === 0) {
      return true;
    }
    const rooms = await this.itemsSrv.getRooms();
    const gastroID = rooms.filter(r => r.get('Key') === 'Gastro')[0].getId();
    const saalID = rooms.filter(r => r.get('Key') === 'Saal 21')[0].getId();
    const salonID = rooms.filter(r => r.get('Key') === 'Salon 21')[0].getId();
    const stationID = rooms
      .filter(r => r.get('Key') === 'Station 21')[0]
      .getId();
    const saalSalonID = rooms
      .filter(r => r.get('Key') === 'Saal + Salon')[0]
      .getId();
    const saalSalonStationID = rooms
      .filter(r => r.get('Key') === 'Saal + Salon + Station')[0]
      .getId();
    const room = rooms.filter(r => r.getId() === roomId)[0];
    let roomTimeslots = [];
    if (
      room.getId() === saalID ||
      room.getId() === salonID ||
      room.getId() === stationID ||
      room.getId() === gastroID
    ) {
      roomTimeslots = futureBookingsByRoom[room.getId()];
    } else if (room.getId() === saalSalonID) {
      roomTimeslots = futureBookingsByRoom[saalSalonID]
        .concat(futureBookingsByRoom[saalID])
        .concat(futureBookingsByRoom[salonID]);
    } else if (room.id === saalSalonStationID) {
      roomTimeslots = futureBookingsByRoom[saalSalonStationID]
        .concat(futureBookingsByRoom[saalID])
        .concat(futureBookingsByRoom[salonID])
        .concat(futureBookingsByRoom[stationID]);
    }
    if (roomTimeslots.filter(r => r).length == 0) {
      return true;
    }
    const bookable = roomTimeslots
      .filter(r => r)
      .reduce((acc, curr) => {
        const tsBeginn = curr.beginn;
        const tsEnd = curr.end;
        const bookable =
          moment(beginn).isAfter(moment(tsEnd)) ||
          moment(end).isBefore(moment(tsBeginn));
        return acc && bookable;
      }, true);

    return bookable;
  }
}

class PersonService {
  constructor(base) {
    this.table = base('Personen');
  }

  async createOrUpdate(p) {
    const defaultRole = 'MieterIn';

    const existing = await this.getByEmail(p.email);
    if (existing) {
      const updated =  await this.table.update(existing.getId(), {
        Email: p.email,
        Vorname: p.firstName,
        Nachname: p.lastName,
        Organisation: p.org,
        Rolle: [defaultRole],
        Strasse: p.street,
        HausNr: p.hno,
        Top: p.ano,
        PLZ: p.postcode,
        Ort: p.city,
        UID: p.uid,
        Umsatzsteuerbefreit: p.umsatzsteuerbefreit
      });
      
      return updated;
    }
    return await this.table.create({
      Email: p.email,
      Vorname: p.firstName,
      Nachname: p.lastName,
      Organisation: p.org,
      Rolle: [defaultRole],
      Strasse: p.street,
      HausNr: p.hno,
      Top: p.ano,
      PLZ: p.postcode,
      Ort: p.city,
      UID: p.uid,
      Umsatzsteuerbefreit: p.umsatzsteuerbefreit
    });
  }

  async getById(id) {
    return await this.table.find(id);
  }

  async getByEmail(email) {
    const r = await this.table
      .select({
        view: 'Alle Personen',
        filterByFormula: '{Email}=' + "'" + email + "'"
      })
      .firstPage();
    if (r.length > 0) {
      return r[0];
    } else return null;
  }
}

module.exports = {
  BookingService: BookingService,
  TimeSlotsService: TimeSlotsService,
  BookableItemsService: BookableItemsService,
  PersonService: PersonService,
  InvoiceService: InvoiceService
};
