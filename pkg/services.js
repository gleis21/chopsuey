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
        maxRecords: 500,
        view: 'Grid view',
        filterByFormula: '{BuchungKey}=' + "'" + bookingKey + "'"
      })
      .firstPage();
  }

  async getEquipmentPrices() {
    return await this.preiseTable
      .select({ maxRecords: 100, view: 'AusstattungPreise' })
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
    return await this.table.create({ Titel: b.title, PIN: b.pin });
  }

  async update(b) {
    const m = await this.personSrv.createOrUpdate(b.person);
    const ts = await this.timeSlotsSrv.create(b.id, b.timeSlotsGroups);
    const equipmentInvoiceItems = await this.invoiceSrv.createInvoiceItems(
      b.equipment
    );
    const invoice = await this.invoiceSrv.createInvoice(equipmentInvoiceItems);
    const bk = {
      Titel: b.title,
      TeilnehmerInnenanzahl: b.participantsCount,
      Status: 'Angefragt',
      Mieter: [m.getId()],
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
        .select({ maxRecords: 10, view: 'Raeume' })
        .firstPage();
    }
    return this.rooms;
  }

  async getEquipment() {
    if (this.equipment.length === 0) {
      this.equipment = await this.table
        .select({ maxRecords: 20, view: 'Ausstattung' })
        .firstPage();
    }
    return this.equipment;
  }
}

class TimeSlotsGroup {
  constructor(ev) {
    this.roomId = ev.roomId;
    this.beginnEvent = moment(ev.beginnDate)
      .add(ev.beginnH, 'h')
      .add(ev.beginnM, 'minutes');
    this.prepDurSec = ev.prepDurH * 60 * 60 + ev.prepDurM * 60;
    this.beginnPrep = moment(this.beginnEvent).subtract(
      this.prepDurSec,
      'seconds'
    );
    this.endPrep = moment(this.beginnEvent);
    this.endEvent = moment(ev.endDate)
      .add(ev.endH, 'h')
      .add(ev.endM, 'minutes');
    this.durSec = moment(this.endEvent).diff(this.beginnEvent, 'seconds');
    this.beginnTeardown = moment(this.endEvent);
    this.teardownDurSec = ev.teardownDurH * 60 * 60 + ev.teardownDurM * 60;
    this.endTeardown = moment(this.beginnTeardown).add(
      this.teardownDurSec,
      'seconds'
    );
    this.beginnCleanning = moment(this.endTeardown);
    this.cleaningDurSec = 60 * 60;
    this.endCleanning = moment(this.beginnCleanning).add(1, 'h');
    this.status = 'OK';
  }
  getTimeSlots() {
    return [
      {
        roomId: this.roomId,
        beginn: this.beginnPrep,
        end: this.endPrep,
        duration: this.prepDurSec,
        type: 'Aufbau',
        status: ''
      },
      {
        roomId: this.roomId,
        beginn: this.beginnEvent,
        end: this.endEvent,
        duration: this.durSec,
        type: 'Veranstaltung',
        status: ''
      },
      {
        roomId: this.roomId,
        beginn: this.beginnTeardown,
        end: this.endTeardown,
        duration: this.teardownDurSec,
        type: 'Abbau',
        status: ''
      },
      {
        roomId: this.roomId,
        beginn: this.beginnCleanning,
        end: this.endCleanning,
        duration: this.cleaningDurSec,
        type: 'Reinigung',
        status: ''
      }
    ];
  }
}

class TimeSlotsService {
  constructor(base, itemsSrv, pubCalendarSrv) {
    this.table = base('Timeslots');
    this.itemsSrv = itemsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
  }

  async getBookingTimeSlots(bookingKey) {
    var x = await this.table
      .select({
        maxRecords: 500,
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

  async create(bookingID, timeSlotsGroups) {
    const futureBookings = await this.getTimeSlotsAfterToday();
    const timeslots = (
      await Promise.all(
        timeSlotsGroups.map(async ev => {
          return await Promise.all(
            ev.getTimeSlots().map(async s => {
              const bookable = await this.isBookable(
                s.roomId,
                s.beginn,
                s.end,
                futureBookings
              );
              return {
                fields: {
                  Beginn: s.beginn.toISOString(),
                  Duration: s.duration,
                  Type: s.type,
                  Buchung: [bookingID],
                  Raum: [s.roomId],
                  Status: bookable ? 'OK' : 'Conflict'
                }
              };
            })
          );
        })
      )
    ).flat();
    return await this.table.create(timeslots); // returns records (record.getId())
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
      return await this.table.update(existing.getId(), {
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
        Umsatzsteuerbefreit: p.umsatzseuerberfreit
      });
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
      Umsatzsteuerbefreit: p.umsatzseuerberfreit
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
  TimeSlotsGroup: TimeSlotsGroup,
  InvoiceService: InvoiceService
};
