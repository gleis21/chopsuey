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
        timeSlots: []
      },
      rooms: [],
      equipment: [],
      hours: [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
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
        const bookedEqp = bookedEquipmentRes.res.filter(r => r.equipmentId === e.id);
        return { id: e.id, name: e.name, count: bookedEqp.length > 0 ? bookedEqp[0].numberBooked: 0, description: e.description, quantity: e.quantity, position: e.position };
      }).sort((a, b) => a.position - b.position);
      if (timeslotsRes.res && timeslotsRes.res.length > 0) {
        this.booking.timeSlots = timeslotsRes.res
      } else {
        this.booking.timeSlots = [
          {
            id: 1,
            roomId: this.rooms[0].id,
            type: 'Veranstaltung',
            beginnDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            beginnH: 9,
            beginnM: 0,
            endDate: moment()
              .add(2, 'd')
              .format('YYYY-MM-DD'),
            endH: 17,
            endM: 0,
            notes: ''
          }
        ];
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

        const end = moment(ts.endDate)
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
      this.loading = true;
      this.booking.equipment = this.booking.equipment.filter(eq => eq.count > 0);
      const res = await fetch('/buchungssystem/api/bookings/' + this.booking.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.booking)
      });
      this.loading = false;
      if (res.ok) {
        this.submitResult = {
          success: true,
          msg: 'Ihre Anfrage wurde erfolgreich gespeichert.'
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
