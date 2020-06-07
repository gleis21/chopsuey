Vue.component('booking-form', {
  template: '#booking-form',
  data: function() {
    return {
      initialized: false,
      initializerWidth: 20,
      submitResult: null,
      loading: false,
      booking: {
        person: {},
        participantsCount: 1,
        equipment: [],
        notes: '',
        timeSlots: [
          {
            id: 1,
            roomId: '',
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
            endM: 0
          }
        ]
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
    const booking = await (await fetch('/api/bookings/' + id)).json();
    const room = await (await fetch('/api/rooms')).json();
    const equipment = await (await fetch('/api/equipment')).json();
    this.rooms = room.res;
    this.booking.equipment = equipment.res.map(e => {
      return { id: e.id, name: e.name, count: 0 };
    });
    this.booking.timeSlots[0].roomId = this.rooms[0].id
    this.booking = { ...this.booking, ...booking.res };

    this.initializerWidth = 100;
    setTimeout(() => (this.initialized = true), 150);
  },
  methods: {
    addTimeSlot: function() {
      const lastRange = this.booking.timeSlots[
        this.booking.timeSlots.length - 1
      ];
      this.booking.timeSlots = [...this.booking.timeSlots, { ...lastRange }];
    },
    deleteTimeSlot: function(index) {
      this.booking.timeSlots.splice(index, 1);
    },
    submit: async function() {
      this.loading = true;
      this.booking.equipment = this.booking.equipment.filter(eq => eq.count > 0);
      const res = await fetch('/api/bookings/' + this.booking.id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
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
          msg: 'Ups... das hätte nie passieren sollen.'
        };
      }
    }
  }
});

new Vue({ el: '#app' });
