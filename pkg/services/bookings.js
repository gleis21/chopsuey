const moment = require('moment');

class BookingService {
  constructor(base, timeSlotsSrv, pubCalendarSrv) {
    this.table = base('Buchungen');
    this.timeSlotsSrv = timeSlotsSrv;
    this.pubCalendarSrv = pubCalendarSrv;
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
  }
  async getRooms() {
    await this.table.select({ maxRecords: 10, view: 'Raeume' }).firstPage();
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
}

class TimeSlots {
  constructor(timeslotsDto) {
    this.beginnPrep = moment(timeslotsDto.beginn);
    this.beginnEvent = beginn.add(timeslotsDto.preparationDurationHours, 'h');
    this.beginnTeardown = beginnEvent.add(timeslotsDto.eventDurationHours, 'h');
    this.cleaningBeginn = beginnTeardown.add(
      timeslotsDto.teardownDurationHours,
      'h'
    );
    this.cleaningEnd = cleaningBeginn.add(1, 'h');
  }
}

class TimeSlotsService {
  constructor(base) {
    this.table = base('Timeslots');
  }

  async getByRoom(room) {}

  async create(bookingID, room, timeslotsDto) {
    const tsModel = new TimeSlots(timeslotsDto);

    const beginnPrep = tsModel.beginnPrep;
    const beginnEvent = tsModel.beginnEvent;
    const beginnTeardown = tsModel.beginnTeardown;
    const cleaningBeginn = tsModel.cleaningBeginn;

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

  async validate(ts) {
    let roomTimeslots = await this.getByRoom(ts);
    // use moment.js to compare ranges
    return true;
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
      Adresse: personDto.adresse
    });
  }

  async getByEmail(email) {}
}
