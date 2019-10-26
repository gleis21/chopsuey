Vue.component('booking-form', {
  template: '#booking-form',
  data: function() {
    return {
      booking: { equipmentIds: [], roomId: '' },
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
      mins: [0, 30],
      timeslots: [
        {
          id: 1,
          beginnDate: moment()
            .add(1, 'd')
            .format('YYYY-MM-DD'),
          beginnH: 9,
          beginnM: 0,
          endDate: moment()
            .add(1, 'd')
            .format('YYYY-MM-DD'),
          endH: 17,
          endM: 0,
          prepDurH: 1,
          prepDurM: 0,
          teardownDurH: 1,
          teardownDurM: 0
        }
      ]
    };
  },
  async mounted() {
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    const b = await (await fetch('/api/bookings/' + id)).json();
    const r = await (await fetch('/api/rooms')).json();
    const e = await (await fetch('/api/equipment')).json();

    this.booking = b.booking;
    this.rooms = r.rooms;
    this.equipment = e.equipment;
  },
  methods: {
    addTimeslot: () => {},
    submit: () => {}
  }
});

new Vue({ el: '#app' });
