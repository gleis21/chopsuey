const moment = require('moment');

class BookingService {
  constructor(base, timeSlotsSrv, pubCalendarSrv, personSrv) {
    this.table = base('Buchungen');
    this.timeSlotsSrv = timeSlotsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
    this.personSrv = personSrv;
  }
  async get(id) {
    return await this.table.find(id);
  }

  async update(b) {
    console.log(JSON.stringify(b));
    const m = await this.personSrv.createOrUpdate(b.person);
    console.log(JSON.stringify(m));
    const ts = await this.timeSlotsSrv.create(b.id, b.eventsTimeRanges);
    console.log(JSON.stringify(ts));
    const pbc = await this.pubCalendarSrv.create(b.id);
    console.log(JSON.stringify(pbc));
    const bk = {
      id: b.id,
      fields: {
        Titel: b.title,
        Raum: b.roomIds,
        Ausstattung: b.equipmentIds,
        Status: 'Angefragt',
        Mieter: [m.getId()],
        Timeslots: ts.map(s => s.getId()),
        PublicTimeslots: [pbc.getId()]
      }
    };
    console.log(JSON.stringify(bk));
    return await this.table.update(bk);
  }
}

class ItemsService {
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

class PubCalendarService {
  constructor(base) {
    this.table = base('PublicCalendar');
  }

  async create(bookingID) {
    return await this.table.create({
      fields: {
        Buchung: [bookingID]
      }
    });
  }

  async getFutureBookings() {
    const futureBookings = await this.table
      .select({ maxRecords: 1000, view: 'Future' })
      .firstPage();
    const groupedByRoom = futureBookings.reduce((acc, curr) => {
      const roomId = curr.get('_roomId');
      if (!acc[roomId]) acc[roomId] = [];
      acc[roomId].push({ beginn: curr.get('Beginn'), end: curr.get('Ende') });
      return acc;
    }, {});

    return groupedByRoom;
  }
}

class EventTimeRanges {
  constructor(ev) {
    this.beginnEvent = moment(ev.beginnDate)
      .add(ev.beginnH, 'h')
      .add(ev.beginnM, 'minutes');
    this.prepDurSec = ev.prepDurH * 60 * 60 + ev.prepDurM * 60;
    this.beginnPrep = this.beginnEvent.subtract(this.prepDurSec, 'seconds');
    this.endEvent = moment(ev.endDate)
      .add(ev.endH, 'h')
      .add(ev.endM, 'minutes');
    this.durSec = moment(this.endEvent).diff(this.beginnEvent, 'seconds');
    this.beginnTeardown = moment(this.endEvent);
    this.teardownDurSec = ev.teardownDurH * 60 * 60;
    this.cleaningBeginn = this.beginnTeardown.add(ev.teardownDurH, 'h');
    this.cleaningDurSec = 60 * 60;
    this.cleaningEnd = this.cleaningBeginn.add(1, 'h');
  }
}

class TimeSlotsService {
  constructor(base, itemsSrv, pubCalendarSrv) {
    this.table = base('Timeslots');
    this.itemsSrv = itemsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
  }

  async create(bookingID, eventsTimeRanges) {
    const timeslots = eventsTimeRanges
      .map(ev => {
        const prep = {
          fields: {
            'Beginn Time': ev.beginnPrep.toISOString(),
            Duration: ev.prepDurSec,
            Type: 'Aufbau',
            Buchung: [bookingID]
          }
        };
        const event = {
          fields: {
            'Beginn Time': ev.beginnEvent.toISOString(),
            Duration: ev.durSec,
            Type: 'Veranstaltung',
            Buchung: [bookingID]
          }
        };

        const teardown = {
          fields: {
            'Beginn Time': ev.beginnTeardown.toISOString(),
            Duration: ev.teardownDurSec,
            Type: 'Abbau',
            Buchung: [bookingID]
          }
        };

        const cleaning = {
          fields: {
            'Beginn Time': ev.cleaningBeginn.toISOString(),
            Duration: ev.cleaningDurSec, // default 1 h, needs to be adjusted?
            Type: 'Reinigung',
            Buchung: [bookingID]
          }
        };
        return [prep, event, teardown, cleaning];
      })
      .flat();

    return await this.table.create(timeslots); // returns records (record.getId())
  }

  async areBookable(roomId, events) {
    const futureBookings = await this.pubCalendarSrv.getFutureBookings(roomId);
    for (let index = 0; index < events.length; index++) {
      const e = events[index];
      if (
        !(await this.isBookable(
          roomId,
          e.beginnPrep,
          e.cleaningEnd,
          futureBookings
        ))
      ) {
        return false;
      }
    }
    return true;
  }

  async isBookable(roomId, beginn, end, futureBookingsByRoom) {
    const rooms = await this.itemsSrv.getRooms();
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
      room.getId() === stationID
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
    if (!roomTimeslots) {
      return true;
    }
    console.log(JSON.stringify(roomTimeslots));
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
      return existing;
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
      Ort: p.city
    });
  }

  async getByEmail(email) {}
}

module.exports = {
  BookingService: BookingService,
  TimeSlotsService: TimeSlotsService,
  PubCalendarService: PubCalendarService,
  ItemsService: ItemsService,
  PersonService: PersonService,
  EventTimeRanges: EventTimeRanges
};
