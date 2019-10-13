const moment = require('moment');

class BookingService {
  constructor(base, timeSlotsSrv, pubCalendarSrv) {
    this.table = base('Buchungen');
    this.timeSlotsSrv = timeSlotsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
  }
  async get(id) {
    return await this.table.find(id);
  }

  async update(bookingDto) {
    await this.table.update({
      id: bookingDto.bookingID,
      fields: {
        Timeslots: (await this.timeSlotsSrv.create(
          bookingDto.bookingID,
          bookingDto.timeSlots
        )).map(s => this.getId()),
        Status: 'Angefragt',
        Mieter: [
          (await this.personSrv.createOrUpdate(bookingDto.personDto)).getId()
        ],
        Titel: bookingDto.titel,
        Raum: [
          (await this.inventorySrv.getRoomByName(bookingDto.room)).getId()
        ],
        PublicTimeslots: [
          (await this.pubCalendarSrv.create(bookingDto.bookingID)).getId()
        ]
      }
    });
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
      if (!acc[curr.id]) acc[id] = [];
      acc[id].push(curr);
      return acc;
    }, {});

    return groupedByRoom;
  }
}

class TimeSlots {
  constructor(timeslotsDto) {
    this.beginnEvent = momennt(timeslotsDto.beginnEvent);
    this.beginnPrep = beginnEvent.subtract(
      timeslotsDto.preparationDurationHours,
      'h'
    );
    this.beginnTeardown = beginnEvent.add(timeslotsDto.eventDurationHours, 'h');
    this.cleaningBeginn = beginnTeardown.add(
      timeslotsDto.teardownDurationHours,
      'h'
    );
    this.cleaningEnd = cleaningBeginn.add(1, 'h');
  }
}

class TimeSlotsService {
  constructor(base, itemsSrv, pubCalendarSrv) {
    this.table = base('Timeslots');
    this.itemsSrv = itemsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
  }

  async create(bookingID, roomRecordID, timeslotsDto) {
    const tsModel = new TimeSlots(timeslotsDto);

    const beginnPrep = tsModel.beginnPrep;
    const beginnEvent = tsModel.beginnEvent;
    const beginnTeardown = tsModel.beginnTeardown;
    const cleaningBeginn = tsModel.cleaningBeginn;
    const cleaningEnd = tsModel.cleaningBeginn.add(1, 'h');

    const isBookable = await isBookable(roomRecordID, beginnPrep, cleaningEnd);
    if (!isBookable) {
      return null;
    }

    const prep = {
      fields: {
        'Beginn Time': beginnPrep.toISOString(),
        Duration: timeslotsDto.preparationDurationHours * 60 * 60,
        Type: 'Aufbau',
        Buchung: [bookingID]
      }
    };
    const event = {
      fields: {
        'Beginn Time': beginnEvent.toISOString(),
        Duration: timeslotsDto.eventDurationHours * 60 * 60,
        Type: 'Veranstaltung',
        Buchung: [bookingID]
      }
    };

    const teardown = {
      fields: {
        'Beginn Time': beginnTeardown.toISOString(),
        Duration: timeslotsDto.teardownDurationHours * 60 * 60,
        Type: 'Abbau',
        Buchung: [bookingID]
      }
    };

    const cleaning = {
      fields: {
        'Beginn Time': cleaningBeginn.toISOString(),
        Duration: 1 * 60 * 60, // default 1 h, needs to be adjusted
        Type: 'Reinigung',
        Buchung: [bookingID]
      }
    };
    return await this.table.create([prep, event, teardown, cleaning]); // returns records (record.getId())
  }

  async isBookable(roomRecordID, beginn, end) {
    const rooms = await this.itemsSrv.getRooms();

    const saalID = rooms.filter(r => r.get('Key' === 'Saal 21'))[0].id;
    const salonID = rooms.filter(r => r.get('Key' === 'Salon 21'))[0].id;
    const stationID = rooms.filter(r => r.get('Key' === 'Station 21'))[0].id;
    const saalSalonID = rooms.filter(r => r.get('Key' === 'Saal + Salon'))[0]
      .id;
    const saalSalonStationID = rooms.filter(r =>
      r.get('Key' === 'Saal + Salon + Station')
    )[0].id;

    const room = rooms.filter(r => r.id === roomRecordID);
    const bookingsByRoom = await this.pubCalendarSrv.getFutureBookings(
      roomRecordID
    );
    let roomTimeslots = [];
    if (room.id === saalID || room.id === salonID || room.id === stationID) {
      roomTimeslots = bookingsByRoom[room.id];
    } else if (room.id === saalSalonID) {
      roomTimeslots = bookingsByRoom[saalSalonID]
        .concat(bookingsByRoom[saalID])
        .concat(bookingsByRoom[salonID]);
    } else if (room.id === saalSalonStationID) {
      roomTimeslots = bookingsByRoom[saalSalonStationID]
        .concat(bookingsByRoom[saalID])
        .concat(bookingsByRoom[salonID])
        .concat(bookingsByRoom[stationID]);
    }

    const bookable = roomTimeslots.reduce((acc, curr) => {
      const tsBeginn = curr.get('Beginn');
      const tsEnd = curr.get('Ende');

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

  async createOrUpdate(personDto) {
    const defaultRole = 'MieterIn';
    const p = await this.getByEmail(p.email);
    if (p) {
      return await this.table.update(personDto.id, {
        Name: personDto.name,
        Rolle: [defaultRole],
        Adresse: personDto.dresse
      });
    }
    return await this.table.create({
      Email: personDto.email,
      Name: personDto.name,
      Rolle: [defaultRole],
      Adresse: personDto.address
    });
  }

  async getByEmail(email) {}
}

module.exports = {
  BookingService: BookingService,
  TimeSlotsService: TimeSlotsService,
  PubCalendarService: PubCalendarService,
  ItemsService: ItemsService
};
