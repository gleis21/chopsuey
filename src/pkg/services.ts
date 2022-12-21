import { Base, FieldSet, Record, Records, Table } from "airtable";

const moment = require('moment');

class InvoiceService {
  rechnungenTable: Table<FieldSet>;
  rechnungspostenTable: Table<FieldSet>;
  preiseTable: Table<FieldSet>;
  itemsSrv: any;
  constructor(base: Base, itemsSrv: any) {
    this.rechnungenTable = base('Rechnungen');
    this.rechnungspostenTable = base('Rechnungsposten');
    this.preiseTable = base('Preise');
    this.itemsSrv = itemsSrv;
  }

  async createInvoice(bookingId: string, invoiceItems) {
    await this.deleteInvoceItemsByBooking(bookingId);
    const invoices = await this.getInvoceByBooking(bookingId);
    if (invoices && invoices.length > 0) {
      const invoice = invoices[0];
      const existing: any[]= invoice.get('Rechnungsposten') != undefined? invoice.get('Rechnungsposten') as any[]: [];
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

  async getInvoceByBooking(bookingRecordId: string) {
    return await this.rechnungenTable
      .select({
        maxRecords: 1,
        view: 'Grid view',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'", pageSize: 100
      })
      .firstPage();
  }

  async getInvoceItemsByBooking(bookingRecordId: string) {
    return await this.rechnungspostenTable
      .select({
        view: 'Grid view',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'", pageSize: 100
      })
      .firstPage();
  }

  async deleteInvoceItemsByBooking(bookingRecordId:string) {
    const equipmentItemsIds = (await this.getInvoceItemsByBooking(bookingRecordId))
      .map(it => it.getId());
    if (equipmentItemsIds && equipmentItemsIds.length > 0) {
      var i, j, tmp, chunk = 10;
      for (i = 0, j = equipmentItemsIds.length; i < j; i += chunk) {
        tmp = equipmentItemsIds.slice(i, i + chunk);
        await this.rechnungspostenTable.destroy(tmp);
      }
    }
  }

  async getEquipmentPrices(): Promise<Record<FieldSet>[]> {
    return await new Promise((resolve, reject) => {
      const allPrices: Record<FieldSet>[] = [];
      this.preiseTable
      .select({ view: 'AusstattungPreise', pageSize: 100 })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(record => {
            allPrices.push(record);
          });
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
          } else {
            resolve(allPrices);
          }
        }
      );
    });
  }

  calculatePrices(articlePrices, durationsInHours) {
    
    const variant1h = articlePrices.find(p => p.get('Variante') === "1 Stunde" && (!p.get('Typ') || p.get('Typ') == "Regulärer Tarif"));
    const variant2h = articlePrices.find(p => p.get('Variante') === "2 Stunden" && (!p.get('Typ') || p.get('Typ') == "Regulärer Tarif"));
    const variant4h = articlePrices.find(p => p.get('Variante') === "halbtags" && (!p.get('Typ') || p.get('Typ') == "Regulärer Tarif"));
    const variant1day = articlePrices.find(p => p.get('Variante') === "ganztags" && (!p.get('Typ') || p.get('Typ') == "Regulärer Tarif"));

    return durationsInHours.map(dur => {
      var variant = null;
      if (articlePrices.length === 1) {
        variant = articlePrices[0];
      } else if (dur.duration === 1 && variant1h) {
        variant = variant1h;
      } else if (dur.duration <= 2 && (variant2h || variant4h)) {
        variant = variant2h ? variant2h : variant4h;
      } else if (dur.duration > 2 && dur.duration <= 4 && variant4h) {
        variant = variant4h;
      } else if (dur.duration > 4 && variant1day) {
        variant = variant1day;
      } else{
        variant = articlePrices[0];
      }
      return {priceVariant: variant, timeSlotId: dur.timeSlotId}
    });
  }

  async createInvoiceItems(items, durations, participantsCount): Promise<Record<FieldSet>[]> {
    const eqPrices = await this.getEquipmentPrices();

    // items have an id and count
    const invoiceItems: Partial<FieldSet> = items
      .map(it => {
        const articlePrices = eqPrices.filter(ep => ep.get('Artikel') && ep.get('Artikel')[0] === it.id);
        if (!articlePrices || articlePrices.length == 0) {
          console.log('error: no price found for artikel ' + it.id);
        }

        return this.calculatePrices(articlePrices, durations).map(p => {
          return {
            priceId: p.priceVariant.getId(),
            count: p.priceVariant.get('MultiplizierenMitTeilnehmerAnzahl') ? it.count * participantsCount : it.count,
            notes: it.notes,
            timeSlotId: p.timeSlotId
          };
        })
      })
      .flat()
      .map(p => {
        return {
          fields: {
            Anzahl: parseInt(p.count, 10),
            Preis: [p.priceId],
            Anmerkung: p.notes,
            Timeslots: [p.timeSlotId]
          }
        };
      });
    var createdInvoiceItems: Record<FieldSet>[] = [];
    // Airtable allows only 10 at once
    var i, j, tmp, chunk = 10;
    for (i = 0, j = invoiceItems.length; i < j; i += chunk) {
      tmp = invoiceItems.slice(i, i + chunk);
      const its = await this.rechnungspostenTable.create(tmp);
      createdInvoiceItems = createdInvoiceItems.concat(its);
    }

    return createdInvoiceItems;
  }
}

class BookingService {
  table: Table<FieldSet>;
  timeSlotsSrv: TimeSlotsService;
  personSrv: PersonService;
  invoiceSrv: InvoiceService;
  constructor(base: Base, timeSlotsSrv: TimeSlotsService, personSrv: PersonService, invoiceSrv: InvoiceService) {
    this.table = base('Buchungen');
    this.timeSlotsSrv = timeSlotsSrv;
    this.personSrv = personSrv;
    this.invoiceSrv = invoiceSrv;
  }
  async get(id: string) {
    return await this.table.find(id);
  }

  // Create a stub entry in the 'Buchungen' table to be updated by the tenant.
  // - receives an object with the fields 'customerEmail', 'title' and 'pin'
  // - checks if a customer with the given email-address already exists in the 
  // 'Personen' table and creates a new one, if this is not the case. 
  async create(b) {
    var customer = await this.personSrv.getByEmail(b.customerEmail);
    if (!customer) {
      customer = await this.personSrv.createOrUpdate({ email: b.customerEmail })
    }
    return await this.table.create({ Name: b.name, Mieter: [customer.getId()], PIN: b.pin, SendAutoMail: b.sendAutoMail, Status: 'Neu' });
  }

  private async updateStatus(bookingId: string, newStatus:string) {
    return await this.table.update(bookingId, {Status: newStatus});
  }

  async checkout(bookingId: string) {
    return await this.table.update(bookingId, {Status: 'Vertrag unterschrieben', Checkoutzeit: moment().toISOString()});
  }

  async update(b) {
    const person = await this.personSrv.createOrUpdate(b.person);
    const createdTimeSlots = await this.timeSlotsSrv.replaceEventBookingTimeSlots(b.id, b.timeSlots);

    var invoiceItems: Record<FieldSet>[] = [];
    if (b.equipment && b.equipment.length > 0) {
      const durations = this.timeSlotsSrv.getDurations(createdTimeSlots);
      const equipmentInvoiceItems = await this.invoiceSrv.createInvoiceItems(b.equipment, durations, b.participantsCount);
      invoiceItems = invoiceItems.concat(equipmentInvoiceItems);
    }
    for (let i = 0; i < createdTimeSlots.length; i++) {
      const ts = createdTimeSlots[i];
      const rooms = [{ id: ts.get('Raum')[0], count: 1 }];
      const durations = [this.timeSlotsSrv.getDuration(ts)];
      const roomsInvoiceItems = await this.invoiceSrv.createInvoiceItems(rooms, durations, b.participantsCount);
      invoiceItems = invoiceItems.concat(roomsInvoiceItems);
    }

    const invoice = await this.invoiceSrv.createInvoice(b.id, invoiceItems);
    const bk = {
      Name: b.name,
      TeilnehmerInnenanzahl: b.participantsCount,
      Status: 'Vorreserviert',
      Mieter: [person.getId()],
      Notes: b.notes,
      Timeslots: createdTimeSlots.map(ts => ts.getId()),
      Rechnungen: [invoice.getId()]
    };
    return await this.table.update(b.id, bk);
  }
}

class BookableItemsService {
  rooms: Records<FieldSet>;
  equipment: Records<FieldSet>;
  table: Table<FieldSet>;
  constructor(base: Base) {
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
  table: Table<FieldSet>;
  itemsSrv: BookableItemsService;
  constructor(base: Base, itemsSrv: BookableItemsService) {
    this.table = base('Timeslots');
    this.itemsSrv = itemsSrv;
  }

  async getBookingTimeSlots(bookingRecordId: string) {
    return await this.table
      .select({
        view: 'Alles',
        filterByFormula: '{BuchungRecordId}=' + "'" + bookingRecordId + "'"
      })
      .firstPage();
  }

  async replaceEventBookingTimeSlots(bookingRecordId: string, timeSlots:Partial<FieldSet>) {
    const allBookingTimeSlots = await this.getBookingTimeSlots(bookingRecordId);
    const eventTimeSlotsIds = allBookingTimeSlots
      .filter(r => r.get('Type') === 'Veranstaltung')
      .map(r => r.getId());
    if (eventTimeSlotsIds && eventTimeSlotsIds.length > 0) {
      var i, j, tmp, chunk = 10;
      for (i = 0, j = eventTimeSlotsIds.length; i < j; i += chunk) {
        tmp = eventTimeSlotsIds.slice(i, i + chunk);
        await this.table.destroy(tmp);
      }
      
    }
    const otherTimeSlotsIds = allBookingTimeSlots
      .filter(r => r.get('Type') !== 'Veranstaltung');
    const newTimeSlotsIds = (await this.create(bookingRecordId, timeSlots));
    return [...otherTimeSlotsIds, ...newTimeSlotsIds];
  }

  getDuration(ts) {
    // t.get('Duration') is in seconds but moment.duration expects ms
    return { duration: moment.duration(ts.get('Duration')*1000).get('hours'), timeSlotId: ts.getId() };
  }

  getDurations(timeSlots) {
    return timeSlots.map(ts => {
      return this.getDuration(ts);
    });
  }

  async create(bookingID: string, timeSlots) {
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
          Notes: ts.notes,
          Moeblierung: ts.moeblierung
        }
      };
    }));
    var createdTimeSlots = [];
    // Airtable allows only 10 at once
    var i, j, tmp, chunk = 10;
    for (i = 0, j = slots.length; i < j; i += chunk) {
      tmp = slots.slice(i, i + chunk);
      const its = await this.table.create(tmp);
      createdTimeSlots = createdTimeSlots.concat(its);
    }
    return createdTimeSlots;
  }
}

class PersonService {
  table: Table<FieldSet>;
  constructor(base: Base) {
    this.table = base('Personen');
  }

  async createOrUpdate(p) {
    const defaultRole = 'MieterIn';

    const existing = await this.getByEmail(p.email);
    if (existing) {
      const updated = await this.table.update(existing.getId(), {
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
        Tel: p.tel
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
      Tel: p.tel
    });
  }

  async getById(id) {
    return await this.table.find(id);
  }

  async getByEmail(email: string) {
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

export {
  BookingService,
  TimeSlotsService,
  BookableItemsService,
  PersonService,
  InvoiceService
};
