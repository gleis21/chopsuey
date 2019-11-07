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
        equipmentIds: [],
        roomId: '',
        notes: '',
        timeSlotsGroups: [
          {
            id: 1,
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
            prepDurH: 1,
            prepDurM: 0,
            teardownDurH: 1,
            teardownDurM: 0
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
    this.equipment = equipment.res;
    this.booking = { ...this.booking, ...booking.res };
    this.booking.roomId = this.rooms[0].id;

    this.initializerWidth = 100;
    setTimeout(() => (this.initialized = true), 150);
  },
  methods: {
    addTimeRange: function() {
      const lastRange = this.booking.timeSlotsGroups[
        this.booking.timeSlotsGroups.length - 1
      ];
      this.booking.timeSlotsGroups = [
        ...this.booking.timeSlotsGroups,
        { ...lastRange }
      ];
    },
    submit: async function() {
      this.loading = true;
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
          msg: 'Ups... something went wrong.'
        };
      }
    }
  }
});

new Vue({ el: '#app' });
