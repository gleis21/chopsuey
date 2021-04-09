const moment = require('moment');

class InvoiceService {
  constructor(base, itemsSrv) {
    this.rechnungenTable = base('Rechnungen');
    this.rechnungspostenTable = base('Rechnungsposten');
    this.preiseTable = base('Preise');
    this.itemsSrv = itemsSrv;
  }

  async createInvoice(bookingId, invoiceItems) {
    await this.deleteEquipmentInvoceItemsByBooking(bookingId);
    const invoices = await this.getInvoceByBooking(bookingId);
    if (invoices && invoices.length > 0) {
      const invoice = invoices[0];
      const existing = invoice.get('Rechnungsposten') ? invoice.get('Rechnungsposten') : [];
      return await this.rechnungenTable.update(invoice.getId(), {
        Rechnungsposten: [...existing, ...invoiceItems.map(it => it.getId())],
        Status: invoice.get('Status'),
        Rechnungsdatum: invoice.get('Rechnungsdatum')
      });
    }
    return await this.rechnungenTable.create({
      Rechnungsposten: invoiceItems.map(it => it.getId()),
      Status: 'Neu',
      Rechnungsdatum: moment().toISOString()
    });
  }

  async getInvoceByBooking(bookingRecordId) {
    return await this.rechnungenTable
      .select({
        maxRecords: 1,
        view: 'Grid view',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'", pageSize: 100
      })
      .firstPage();
  }

  async getInvoceItemsByBooking(bookingRecordId) {
    return await this.rechnungspostenTable
      .select({
        view: 'Grid view',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'", pageSize: 100
      })
      .firstPage();
  }

  async deleteEquipmentInvoceItemsByBooking(bookingRecordId) {
    const equipmentItemsIds = (await this.getInvoceItemsByBooking(bookingRecordId))
      .filter(it => it.get('ArtikelTyp')[0] === 'Ausstattung')
      .map(it => it.getId());
      if (equipmentItemsIds && equipmentItemsIds.length > 0) {
        await this.rechnungspostenTable.destroy(equipmentItemsIds);
      }
  }

  async getEquipmentPrices() {
    return await this.preiseTable
      .select({ view: 'AusstattungPreise', pageSize: 100 })
      .firstPage();
  }

  async createInvoiceItems(items) {
    const eqPrices = await this.getEquipmentPrices();

    // items have an id and count
    const invoiceItems = items
      .map(it => {
        const prices = eqPrices.filter(ep => ep.get('Artikel')[0] === it.id);
        if (!prices || prices.length == 0) {
          console.log('bo price found for artikel ' + it.id);
        }
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
            Preis: [p.priceId]
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

  // Create a stub entry in the 'Buchungen' table to be updated by the tenant.
  // - receives an object with the fields 'customerEmail', 'title' and 'pin'
  // - checks if a customer with the given email-address already exists in the 
  // 'Personen' table and creates a new one, if this is not the case. 
  async create(b) {
    var customer = await this.personSrv.getByEmail(b.customerEmail);
    if (!customer) {
      customer = await this.personSrv.createOrUpdate({email: b.customerEmail})
    }
    return await this.table.create({ Titel: b.title, Mieter: [customer.getId()], PIN: b.pin, SendAutoMail: b.sendAutoMail, Status: 'Neu' });
  }

  async update(b) {
    const person = await this.personSrv.createOrUpdate(b.person);
    const tsIds = await this.timeSlotsSrv.replaceEventBookingTimeSlots(b.id, b.timeSlots);
    var equipmentInvoiceItems = [];
    if (b.equipment && b.equipment.length > 0) {
      equipmentInvoiceItems = await this.invoiceSrv.createInvoiceItems(b.equipment);
    }
    const invoice = await this.invoiceSrv.createInvoice(b.id, equipmentInvoiceItems);
    const bk = {
      Titel: b.title,
      TeilnehmerInnenanzahl: b.participantsCount,
      Status: 'Vorreserviert',
      Mieter: [person.getId()],
      Notes: b.notes,
      Timeslots: tsIds,
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
        .select({ view: 'Ausstattung', pageSize: 100 })
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

  async getBookingTimeSlots(bookingRecordId) {
    return await this.table
      .select({
        view: 'Alles',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'"
      })
      .firstPage();
  }

  async replaceEventBookingTimeSlots(bookingRecordId, timeSlots) {
    const allBookingTimeSlots = await this.getBookingTimeSlots(bookingRecordId);
    const eventTimeSlotsIds = allBookingTimeSlots
      .filter(r => r.get('Type') === 'Veranstaltung')
      .map(r => r.getId());
    if (eventTimeSlotsIds && eventTimeSlotsIds.length > 0) {
      await this.table.destroy(eventTimeSlotsIds);
    }
    const otherTimeSlotsIds = allBookingTimeSlots
    .filter(r => r.get('Type') !== 'Veranstaltung')
    .map(r => r.getId());
    const newTimeSlotsIds = (await this.create(bookingRecordId, timeSlots)).map(ts => ts.getId());
    return [...otherTimeSlotsIds, ...newTimeSlotsIds];
  }

  async create(bookingID, timeSlots) {
    const slots = await Promise.all(timeSlots.map(async ts => {
      const beginn = moment(ts.beginnDate)
        .add(ts.beginnH, 'h')
        .add(ts.beginnM, 'minutes');

      const end = moment(ts.endDate)
        .add(ts.endH, 'h')
        .add(ts.endM, 'minutes');
      const durSec = moment(end).diff(beginn, 'seconds');

      return {
        fields: {
          Beginn: beginn.toISOString(),
          Duration: durSec,
          Type: 'Veranstaltung',
          Buchung: [bookingID],
          Raum: [ts.roomId],
          Notes: ts.notes
        }
      };
    }));
    return await this.table.create(slots); // returns records (record.getId())
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
