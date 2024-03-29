Vue.component('booking-form', {
  template: '#booking-form',
  data: function () {
    return {
      initialized: false,
      initializerWidth: 20,
      submitResult: null,
      error: null,
      loading: false,
      booking: {
        person: {},
        participantsCount: 1,
        equipment: [],
        notes: '',
        timeSlots: [],
        isNGO: false,
        hau: ''
      },
      moeblierungen: ['Ohne Möblierung', 'Block', 'Cafe', 'Carre', 'Geschwungene-Reihen', 'Kreis', 'U-Form', 'Kino Bestuhlung', 'Andere'],
      hauOptions: [
        'Website',
        'Social media',
        'Newsletter',
        'Freunde und Bekannte',
        'Google',
        'Sonstiges'
      ],
      rooms: [],
      equipment: [],
      hours: [
        0,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23
      ],
      mins: [0, 30]
    };
  },
  async mounted() {
    this.initializerWidth = 60;
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    const booking = await (await fetch('/buchungssystem/api/bookings/' + id)).json();
    if (booking.err) {
      if (booking.err === 1001) {
        this.error = 'Das Bearbeiten der Buchung ist nicht mehr möglich.';
      } else {
        this.error = 'Ups... das hätte nie passieren sollen.';
      }
    } else {
      const roomsRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/availablerooms', {
        method: 'get'
      })).json();
      const equipmentRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/availableequipment', {
        method: 'get'
      })).json();
      const bookedEquipmentRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/bookedequipment', {
        method: 'get'
      })).json();
      const timeslotsRes = await (await fetch('/buchungssystem/api/bookings/' + id + '/eventtimeslots', {
        method: 'get'
      })).json();

      this.rooms = roomsRes.res;
      this.booking.equipment = equipmentRes.res.map(e => {
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
      }).sort((a, b) => a.position - b.position);
      if (timeslotsRes.res && timeslotsRes.res.length > 0) {
        this.booking.timeSlots = timeslotsRes.res
      } else {
        this.booking.timeSlots = [
          {
            id: 1,
            roomId: this.rooms[0].id,
            type: 'Veranstaltung',
            moeblierung: 'Kreis',
            beginnDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            beginnH: 9,
            beginnM: 0,
            endH: 17,
            endM: 0,
            notes: ''
          }
        ];
      }
      if (booking && booking.participantsCount > 1) {
        this.booking.participantsCount = booking.participantsCount;
      }
      this.booking = { ...this.booking, ...booking.res };
    }
    this.initializerWidth = 100;
    setTimeout(() => (this.initialized = true), 150);
  },
  methods: {
    addTimeSlot: function () {
      const lastRange = this.booking.timeSlots[
        this.booking.timeSlots.length - 1
      ];
      this.booking.timeSlots = [...this.booking.timeSlots, { ...lastRange }];
    },
    deleteTimeSlot: function (index) {
      this.booking.timeSlots.splice(index, 1);
    },
    submit: async function () {
      const invalidTimeSlotIndex = this.booking.timeSlots.findIndex(ts => {
        const beginn = moment(ts.beginnDate)
          .add(ts.beginnH, 'h')
          .add(ts.beginnM, 'minutes');

        const end = moment(ts.beginnDate)
          .add(ts.endH, 'h')
          .add(ts.endM, 'minutes');

        return end.isBefore(beginn)
      });
      if (invalidTimeSlotIndex > -1) {
        this.submitResult = {
          success: false,
          msg: `Zeitraum nr ${invalidTimeSlotIndex + 1} ist ungültig. Bitte überprüfen Sie, ob das Ende nicht vor dem Beginn liegt.`
        };
        return;
      }

      const maxEndExceededTimeSlotIndex = this.booking.timeSlots.findIndex(ts => {
        const end = moment(ts.beginnDate)
          .add(ts.endH, 'h')
          .add(ts.endM, 'minutes');

        const maxEnd = moment(ts.beginnDate)
          .add(1, 'days')
          .add(30, 'minutes');
        return end.isAfter(maxEnd);
      });
      if (maxEndExceededTimeSlotIndex > -1) {
        this.submitResult = {
          success: false,
          msg: `Zeitraum nr ${maxEndExceededTimeSlotIndex + 1} ist ungültig. Das Ende darf maximal 00:30 sein.`
        };
        return;
      }
      this.loading = true;
      const b = { ...this.booking };
      b.equipment = b.equipment.filter(eq => eq.count > 0);
      const res = await fetch('/buchungssystem/api/bookings/' + this.booking.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      this.loading = false;
      if (res.ok) {
        this.submitResult = {
          success: true,
          msg: 'Ihre Buchung wurde erfolgreich gespeichert! Bitte beachten Sie, dass die Reservierung erst durch Bestätigung des Vertrages fixiert wird. Ein Link zum Vertrag wird Ihnen per E-Mail übermittelt.'
        };
      } else {
        this.submitResult = {
          success: false,
          msg: 'Ups... das hätte nie passieren sollen. Bitte kontaktieren Sie uns unter hello@gleis21.wien'
        };
      }
    }
  }
});

new Vue({ el: '#app' });
