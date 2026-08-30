<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import dayjs from 'dayjs';
import {
  getBooking,
  getRooms,
  getEquipment,
  getBookedEquipment,
  getEventTimeSlots,
  updateBooking,
  assetUrl,
  type Booking,
  type Equipment,
  type TimeSlot
} from '../api';

const img = assetUrl;

const initialized = ref(false);
const initializerWidth = ref(20);
const submitResult = ref<{ success: boolean; msg: string } | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);

const moeblierungen = [
  'Ohne Möblierung', 'Block', 'Cafe', 'Carre', 'Geschwungene-Reihen', 'Kreis', 'U-Form', 'Kino Bestuhlung', 'Andere'
];
const hauOptions = [
  'Website', 'Social media', 'Newsletter', 'Freunde und Bekannte', 'Google', 'Sonstiges'
];
const hours = Array.from({ length: 24 }, (_, i) => i);
const mins = [0, 30];

const rooms = ref<{ id: string; name: string }[]>([]);
const booking = reactive<Booking>({
  person: {},
  participantsCount: 1,
  equipment: [],
  notes: '',
  timeSlots: [],
  isNGO: false,
  hau: '',
  workTypeFloor: false,
  workTypePaint: false,
  name: '',
  id: ''
});

function defaultTimeSlot(): TimeSlot {
  return {
    id: 1,
    roomId: rooms.value[0]?.id ?? '',
    type: 'Veranstaltung',
    moeblierung: 'Kreis',
    beginnDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    beginnH: 9,
    beginnM: 0,
    endH: 17,
    endM: 0,
    notes: ''
  };
}

onMounted(async () => {
  initializerWidth.value = 60;
  const pathSegments = window.location.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];

  const b = await getBooking(id);
  if (b.err) {
    error.value = b.err === 1001
      ? 'Das Bearbeiten der Buchung ist nicht mehr möglich.'
      : 'Ups... das hätte nie passieren sollen.';
  } else {
    const roomsRes = await getRooms(id);
    const equipmentRes = await getEquipment(id);
    const bookedEquipmentRes = await getBookedEquipment(id);
    const timeslotsRes = await getEventTimeSlots(id);

    rooms.value = roomsRes.res;
    booking.equipment = equipmentRes.res.map((e: Equipment) => {
      const bookedEqp = bookedEquipmentRes.res.find(r => r.equipmentId === e.id);
      return {
        id: e.id,
        name: e.name,
        count: bookedEqp ? bookedEqp.numberBooked : 0,
        description: e.description,
        quantity: e.quantity,
        position: e.position,
        notesTitle: e.notesTitle,
        notes: bookedEqp ? bookedEqp.notes : null
      };
    }).sort((a: Equipment, b: Equipment) => (a.position ?? 0) - (b.position ?? 0));

    if (timeslotsRes.res && timeslotsRes.res.length > 0) {
      booking.timeSlots = timeslotsRes.res;
    } else {
      booking.timeSlots = [defaultTimeSlot()];
    }
    if (b.res.participantsCount && b.res.participantsCount > 1) {
      booking.participantsCount = b.res.participantsCount;
    }
    Object.assign(booking, b.res);
    if (!booking.id) booking.id = id;
  }
  initializerWidth.value = 100;
  setTimeout(() => (initialized.value = true), 150);
});

function addTimeSlot() {
  const lastRange = booking.timeSlots[booking.timeSlots.length - 1];
  booking.timeSlots = [...booking.timeSlots, { ...lastRange }];
}

function deleteTimeSlot(index: number) {
  booking.timeSlots.splice(index, 1);
}

async function submit() {
  if (!booking.name) {
    submitResult.value = { success: false, msg: 'Veranstaltungstitel/Art der Veranstaltung fehlt!' };
    return;
  }
  if (!booking.participantsCount) {
    submitResult.value = { success: false, msg: 'Gesamtteilnehmerzahl fehlt!' };
    return;
  }
  if (!booking.person.org) {
    submitResult.value = { success: false, msg: 'Organisation/Firma fehlt!' };
    return;
  }
  if (!booking.person.firstName) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Vorname fehlt!' };
    return;
  }
  if (!booking.person.lastName) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Nachname fehlt!' };
    return;
  }
  if (!booking.person.email) {
    submitResult.value = { success: false, msg: 'Ansprechperson/E-Mail-Adresse fehlt!' };
    return;
  }
  if (!booking.person.tel) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Telefonnummer fehlt!' };
    return;
  }
  if (!booking.person.street) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Straße fehlt!' };
    return;
  }
  if (!booking.person.hno) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Hausnummer fehlt!' };
    return;
  }
  if (!booking.person.postcode) {
    submitResult.value = { success: false, msg: 'Ansprechperson/PLZ fehlt!' };
    return;
  }
  if (!booking.person.city) {
    submitResult.value = { success: false, msg: 'Ansprechperson/Stadt fehlt!' };
    return;
  }

  const invalidTimeSlotIndex = booking.timeSlots.findIndex(ts => {
    const beginn = dayjs(ts.beginnDate).add(ts.beginnH, 'hour').add(ts.beginnM, 'minute');
    const end = dayjs(ts.beginnDate).add(ts.endH, 'hour').add(ts.endM, 'minute');
    return end.isBefore(beginn);
  });
  if (invalidTimeSlotIndex > -1) {
    submitResult.value = {
      success: false,
      msg: `Zeitraum nr ${invalidTimeSlotIndex + 1} ist ungültig. Bitte überprüfen Sie, ob das Ende nicht vor dem Beginn liegt.`
    };
    return;
  }

  const maxEndExceededTimeSlotIndex = booking.timeSlots.findIndex(ts => {
    const end = dayjs(ts.beginnDate).add(ts.endH, 'hour').add(ts.endM, 'minute');
    const maxEnd = dayjs(ts.beginnDate).add(1, 'day').add(30, 'minute');
    return end.isAfter(maxEnd);
  });
  if (maxEndExceededTimeSlotIndex > -1) {
    submitResult.value = {
      success: false,
      msg: `Zeitraum nr ${maxEndExceededTimeSlotIndex + 1} ist ungültig. Das Ende darf maximal 00:30 sein.`
    };
    return;
  }

  loading.value = true;
  const b: any = { ...booking };
  b.equipment = b.equipment.filter((eq: Equipment) => eq.count > 0);
  const res = await updateBooking(booking.id!, b);
  loading.value = false;
  submitResult.value = res.err
    ? { success: false, msg: 'Ups... das hätte nie passieren sollen. Bitte kontaktieren Sie uns unter hello@gleis21.wien' }
    : {
        success: true,
        msg: 'Ihre Buchung wurde erfolgreich gespeichert! Bitte beachten Sie, dass die Reservierung erst durch Bestätigung des Vertrages fixiert wird. Ein Link zum Vertrag wird Ihnen per E-Mail übermittelt.'
      };
}
</script>

<template>
  <div class="container">
    <div class="progress" v-if="!initialized">
      <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" aria-valuemin="0" aria-valuemax="100" :style="{ width: initializerWidth + '%' }"></div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="alert alert-danger" role="alert" v-if="error">{{ error }}</div>
      </div>
    </div>
    <div v-if="initialized && !error">
      <p><b>1. Veranstaltung:</b></p>
      <div class="form-group">
        <label for="name">Veranstaltungstitel/Art der Veranstaltung:</label>
        <input type="text" required class="form-control" v-model="booking.name">
      </div>
      <div class="form-group">
        <label for="count">Gesamtteilnehmerzahl (inklusive Publikum und Künstler) – max: 100.</label>
        <input type="number" :min="1" :max="100" required class="form-control" v-model="booking.participantsCount">
      </div>
      <div class="form-group">
        <label for="name">Organisation/Firma</label>
        <input type="text" class="form-control" v-model="booking.person.org">
      </div>
      <div class="form-check">
        <input type="checkbox" class="form-check-input" v-model="booking.isNGO" id="isNgo">
        <label class="form-check-label" for="isNgo"> Die oben genannte Organisation ist eine NPO (nicht gewinnorientierte Organisation).</label>
      </div>
      <br/>
      <p><b>2. Ansprechperson:</b></p>
      <div class="form-group">
        <label for="name">Vorname</label>
        <input type="text" required class="form-control" v-model="booking.person.firstName">
      </div>
      <div class="form-group">
        <label for="name">Nachname</label>
        <input type="text" required class="form-control" v-model="booking.person.lastName">
      </div>
      <div class="form-group">
        <label for="email">E-Mail-Adresse</label>
        <input type="email" required class="form-control" v-model="booking.person.email">
      </div>
      <div class="form-group">
        <label for="tel">Telefonnummer</label>
        <input type="tel" required class="form-control" v-model="booking.person.tel">
      </div>
      <br/>
      <p><b>3. Rechnungsadresse:</b></p>
      <div class="row g-3">
        <div class="form-group col-md-6">
          <label for="address">Strasse</label>
          <input class="form-control" required type="text" v-model="booking.person.street">
        </div>
        <div class="form-group col-md-3">
          <label for="address">Hausnummer</label>
          <input class="form-control" required type="text" v-model="booking.person.hno">
        </div>
        <div class="form-group col-md-3">
          <label for="address">Top</label>
          <input class="form-control" required type="text" v-model="booking.person.ano">
        </div>
      </div>
      <div class="row g-3">
        <div class="form-group col-md-4">
          <label for="address">PLZ</label>
          <input class="form-control" required type="text" v-model="booking.person.postcode">
        </div>
        <div class="form-group col-md-8">
          <label for="address">Ort</label>
          <input class="form-control" required type="text" v-model="booking.person.city">
        </div>
      </div>
      <div class="form-group">
        <label for="name">UID-Nummer</label>
        <input type="text" class="form-control" v-model="booking.person.uid">
      </div>
      <br/>
      <p><b>4. Informationen zu den Räumlichkeiten:</b></p>
      <br/>
      <p><b>Raumplan:</b></p>
      <img :src="img('raumplan.png')" style="width: 1110px">
      <br/>
      <br/>
      <p><b>Raumvarianten:</b></p>
      <ul class="list-group">
        <li class="list-group-item list-group-item flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Saal groß</h5>
          </div>
          <p class="mb-1">-> Veranstaltungsraum 117m&sup2; (max. 100 Personen*)</p>
          <p class="mb-1">-> Foyer (zusätzliche 38m&sup2;) inkludiert</p>
          <p class="mb-1">-> Station** (zusätzliche 15m&sup2;) inkludiert</p>
        </li>
        <li class="list-group-item list-group-item flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Saal klein</h5>
          </div>
          <p class="mb-1">-> Veranstaltungsraum 84&sup2; (max. 85 Personen*)</p>
          <p class="mb-1">-> Foyer (zusätzliche 38m&sup2;) inkludiert</p>
          <p class="mb-1">-> flexible Trennwand zum Salon (bei Bedarf) (siehe Raumplan oben)</p>
        </li>
        <li class="list-group-item list-group-item flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Salon</h5>
          </div>
          <p class="mb-1">-> Veranstaltungsraum 33m&sup2; (max. 15 Personen *)</p>
          <p class="mb-1">-> Station** (zusätzliche 15m²) inkludiert</p>
          <p class="mb-1">-> flexible Trennwand zum Saal klein (bei Bedarf) (siehe Raumplan oben)</p>
        </li>
      </ul>
      <p><i><small><b>* max. Personenanzahl hängt stark von der Möblierung ab! (bitte klären Sie das mit der Ansprechperson)</b></small></i></p>
      <p><i><small><b>** kann als Medienraum/Backstage/Workspaces verwendet werden</b></small></i></p>
      <p><i><small><b>Es können auch zusätzliche Räume (23 m², 24 m², 13 m²) im Untergeschoß zur Verfügung gestellt werden (bitte fragen Sie bei der Ansprechperson an)</b></small></i></p>

      <br/>
      <b>Möblierungen</b>
      <ul class="list-group list-group-horizontal">
        <li class="list-group-item"><img :src="img('moeblierung/block.jpg')"> Block</li>
        <li class="list-group-item"><img :src="img('moeblierung/cafe.jpg')"> Cafe</li>
        <li class="list-group-item"><img :src="img('moeblierung/carre.png')"> Carre</li>
        <li class="list-group-item"><img :src="img('moeblierung/kreis.png')">Kreis</li>
      </ul>
      <ul class="list-group list-group-horizontal">
        <li class="list-group-item"><img :src="img('moeblierung/geschwungene-reihen.png')"> Geschwungene Reihen</li>
        <li class="list-group-item"><img :src="img('moeblierung/uform.jpg')">U-Form</li>
        <li class="list-group-item"><img :src="img('moeblierung/kino.png')">Kino</li>
      </ul>
      <br/>
      <br/>
      <p><b>5. Raum buchen:</b></p>
      <div class="bg-light p-5 mb-4 rounded" v-for="(ts, index) in booking.timeSlots" :key="ts.id ?? index">
        <button type="button" class="btn btn-danger float-end" @click="deleteTimeSlot(index)"><span class="fa fa-trash"></span></button>
        <div class="row g-3">
          <div class="form-group col-md-4">
            <label for="room">Raum</label>
            <select class="form-select" id="room" v-model="ts.roomId">
              <option v-for="r in rooms" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
        </div>
        <div class="row g-3">
          <div class="form-group col-md-4">
            <label for="date">Datum:</label>
            <input type="date" required v-model="ts.beginnDate" class="form-control" id="beginn">
          </div>
        </div>
        <div class="form-group row align-items-center">
          <label for="beginn" class="col-sm-4 col-form-label">Beginn der Raumnutzung (inkl. Ihrer eigenen Vorbereitung):</label>
          <div class="col-sm-8">
            <div class="d-flex">
              <select id="hour" class="form-select me-2 flex-grow-1" v-model="ts.beginnH">
                <option v-for="h in hours" :value="h">{{ h }} Uhr</option>
              </select>
              <select class="form-select" id="minute" v-model="ts.beginnM" style="flex: 0 0 40%">
                <option v-for="m in mins" :value="m">{{ m }} Minuten</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-group row align-items-center">
          <label for="end" class="col-sm-4 col-form-label">Ende der Raumnutzung (inkl. Abbau):</label>
          <div class="col-sm-8">
            <div class="d-flex">
              <select id="hour" class="form-select me-2 flex-grow-1" v-model="ts.endH">
                <option v-for="h in hours" :value="h">{{ h }} Uhr</option>
              </select>
              <select class="form-select" id="minute" v-model="ts.endM" style="flex: 0 0 40%">
                <option v-for="m in mins" :value="m">{{ m }} Minuten</option>
              </select>
            </div>
          </div>
        </div>
        <div class="alert alert-warning" role="alert">
          Bitte beachten Sie: Der <b>Halbtagstarif</b> gilt für Einmietungen von <b>bis zu 5 Stunden (inkl. Ihrer eigenen Vorbereitung, Auf- und Abbau)</b> und abends ab <b>17 Uhr</b>. Buchungen während des Tages, die <b>länger als 5 Stunden dauern</b>, werden mit dem <b>Ganztagstarif</b> verrechnet.
        </div>
        <div class="alert alert-warning" role="alert">
          Wenn Sie unsere Räume an mehreren aufeinanderfolgenden Tagen während des Tages buchen, könnte dazwischen eine Abendveranstaltung stattfinden. Ihr Aufbausetting wird für den nächsten Tag von uns wiederhergestellt. Es besteht die Möglichkeit, Materialien in anderen Nebenräumen zwischenzulagern oder gegen Aufpreis eine Über-Nacht-Buchung vorzunehmen.
        </div>
        <div class="row g-3">
          <div class="form-group col-md-4">
            <label for="room">Möblierung</label>
            <select class="form-select" id="moeblierung" v-model="ts.moeblierung">
              <option v-for="m in moeblierungen" :value="m">{{ m }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="notes">Anmerkungen</label>
          <textarea class="form-control" placeholder="Bitte geben Sie hier Beginn und Ende der Veranstaltung (Uhrzeit) ein." id="tsnotes" rows="5" v-model="ts.notes"></textarea>
        </div>
      
        <div class="row g-3">
          <div class="form-group col-md-6">
            <label for="beginn">Wie haben Sie von uns erfahren?</label>
              <select class="form-select" id="hear-about-us" v-model="booking.hau">
              <option v-for="hau in hauOptions" :value="hau">{{ hau }}</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <button type="button" class="btn btn-success float-end" @click="addTimeSlot"><i class="fa fa-plus"></i>&nbsp;Weitere Termine</button>
          </div>
        </div>
      </div>
      <p><b>6. Ausstattung buchen:</b></p>
      <div style="padding: 10px" class="bg-light p-5 mb-4 rounded">
        <h4>Ausstattung</h4>
        <p>Im Grundpreis sind W-LAN, Soundsystem (nur basic), Möblierung sowie das Saalherrichten inbegriffen.</p>
        <p>Papier für Flipchart und Pinnwand wird von Gleis 21 bereit gestellt. Moderationsmaterial (inkl. Stifte) bringen Sie bitte selber mit. Vielen Dank!</p>
        <p>Änderungen Ihrer Ausstattungswünsche sind auch nach Vertragsabschluss möglich.Bitte teilen Sie uns jedoch Ihre <b>technischen Anforderungen so früh wie möglich</b> mit! Bestimmte Änderungen - z.B. Tonpult-Anschlüsse oder Tonwiedergabe über große Lautsprecher - <b>erfordern Techniker</b> und können bei kurzfristiger Mitteilung ggf. nicht umgesetzt werden.</p>
        <p><b>Extern beauftragte Tontechniker</b> müssen vorab ein Gespräch mit unserem Haustechniker vor Ort führen, um sich mit unserem System vertraut zu machen und die <b>Anschlussmöglichkeiten externer Geräte</b> abzuklären (behördlich vorgeschriebener Vorgang).</p>
        <p>Alle Angaben sind <b>Netto-Preise (exkl. USt).</b></p>
        <div class="form-group row" v-for="e in booking.equipment" :key="e.id">
          <label class="col-sm-4 col-form-label" for="equipment">{{ e.name }}</label>
          <div class="col-sm-3">
            <select v-if="e.quantity == 1" class="form-select" v-model="e.count">
              <option :value="1">Ja</option>
              <option :value="0">Nein</option>
            </select>
            <input v-else class="form-control" required type="number" :min="0" :max="e.quantity" v-model="e.count">
            <template v-if="e.notesTitle && e.count > 0">
              <br />
              <b>{{ e.notesTitle }}</b>
              <textarea class="form-control" id="decription" rows="2" v-model="e.notes"></textarea>
            </template>
          </div>
          <div class="col-sm-4">
            {{ e.description }}
          </div>
        </div>
      </div>

      <br/>
      <div class="form-group">
        <label for="decription">Anmerkungen</label>
        <textarea class="form-control" id="decription" rows="5" v-model="booking.notes"></textarea>
        <br/>
        <div class="form-check">
          <input type="checkbox" class="form-check-input" v-model="booking.workTypeFloor" id="workTypeFloor">
          <label class="form-check-label" for="workTypeFloor"> Wird am Boden gearbeitet? (z.B. Yoga, Meditation, Körperübungen)</label>
        </div>
        <div class="form-check">
          <input type="checkbox" class="form-check-input" v-model="booking.workTypePaint" id="workTypePaint">
          <label class="form-check-label" for="workTypePaint"> Wird mit Farben gearbeitet?</label>
        </div>
      </div>
      <br/>
      <div class="row">
        <div class="col-md-12">
          <div class="alert alert-success" role="alert" v-if="submitResult && submitResult.success">{{ submitResult.msg }}</div>
          <div class="alert alert-danger" role="alert" v-if="submitResult && !submitResult.success">{{ submitResult.msg }}</div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <button type="button" class="btn btn-primary" @click="submit" style="width: 100px"><i class="fa fa-spinner fa-spin" v-if="loading"></i>{{ loading ? '' : 'Absenden' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-group > label,
.form-group label:not(.form-check-label) {
  margin-bottom: 0.75rem;
  margin-top: 0.75rem;
}
</style>
